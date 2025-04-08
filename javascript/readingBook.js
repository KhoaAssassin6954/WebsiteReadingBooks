// Lấy các phần tử DOM
const backButton = document.getElementById('backButton');
const contentViewer = document.getElementById('contentViewer');
const historyMarkersContainer = document.getElementById('historyMarkers');
const markerStyleSelect = document.getElementById('markerStyleSelect');
const markerColorSelect = document.getElementById('markerColorSelect');
const customColorInput = document.getElementById('customColorInput');

// Các biến toàn cục
let currentBookIndex = null;
let scrollDebounceTimeout = null;
const maxHistoryEntries = 5;
let markerStyle = markerStyleSelect.value; // kiểu marker style
let markerColor = markerColorSelect.value; // kiểu marker color

// Sự kiện nút Back
backButton.addEventListener('click', () => {
  window.location.href = "uploadBook.html";
});

// Cập nhật marker style khi chọn trong dropdown
markerStyleSelect.addEventListener('change', (e) => {
  markerStyle = e.target.value;
  updateHistoryMarkers();
});

// Cập nhật marker color khi chọn trong dropdown và hiển thị input color nếu cần
markerColorSelect.addEventListener('change', (e) => {
  markerColor = e.target.value;
  if (markerColor === 'custom') {
    customColorInput.style.display = 'inline-block';
  } else {
    customColorInput.style.display = 'none';
  }
  updateHistoryMarkers();
});

// Khi người dùng thay đổi màu trong color picker, cập nhật marker
customColorInput.addEventListener('input', () => {
  updateHistoryMarkers();
});

// Hàm lấy danh sách sách từ localStorage
function getSavedBooks() {
  return JSON.parse(localStorage.getItem('savedBooks')) || [];
}

// Hàm lưu danh sách sách vào localStorage
function saveBooks(books) {
  localStorage.setItem('savedBooks', JSON.stringify(books));
}

// Hàm chuyển đổi timestamp sang chuỗi "x seconds/minutes/hours/days ago"
function formatTimeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return diffSec + ' seconds ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + ' minutes ago';
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + ' hours ago';
  const diffDay = Math.floor(diffHr / 24);
  return diffDay + ' days ago';
}

// Hàm hiển thị nội dung sách
function displayBook(book, index) {
  contentViewer.innerHTML = '';
  if (book.type === 'doc' || book.type === 'docx') {
    contentViewer.innerHTML = book.data;
  } else if (book.type === 'pdf') {
    displayPDF(book.data);
  } else if (book.type === 'txt') {
    contentViewer.innerHTML = `<pre>${book.data}</pre>`;
  }
  setTimeout(() => {
    contentViewer.scrollTop = book.progress || 0;
    updateHistoryMarkers();
  }, 100);
}

// Hàm render file PDF sử dụng pdf.js
function displayPDF(data) {
  pdfjsLib.getDocument(data).promise.then((pdfDoc) => {
    contentViewer.innerHTML = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      pdfDoc.getPage(i).then((page) => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        contentViewer.appendChild(canvas);
        page.render({ canvasContext: context, viewport: viewport });
      });
    }
  });
}

// Hàm cập nhật tiến độ đọc vào localStorage
function updateCurrentBookProgress(scrollPos) {
  const books = getSavedBooks();
  if (currentBookIndex !== null && books[currentBookIndex]) {
    books[currentBookIndex].progress = scrollPos;
    saveBooks(books);
  }
}

// Hàm ghi nhận vị trí cuộn vào lịch sử marker
function recordScrollPosition(scrollPos) {
  let books = getSavedBooks();
  let currentBook = books[currentBookIndex];
  if (!currentBook.history) currentBook.history = [];
  if (currentBook.history.length === 0 || Math.abs(currentBook.history[currentBook.history.length - 1].pos - scrollPos) > 50) {
    currentBook.history.push({ pos: scrollPos, timestamp: Date.now() });
    if (currentBook.history.length > maxHistoryEntries) {
      currentBook.history.shift();
    }
    saveBooks(books);
    updateHistoryMarkers();
  }
}

// Hàm trả về màu marker dựa trên markerColor
function getMarkerColor(index, total) {
  if (markerColor === 'numbered') {
    return 'red';
  } else if (markerColor === 'brightness') {
    // Sử dụng HSL với hue = 0 (đỏ), saturation = 100%
    // Giảm độ sáng từ 100% đến 50% theo thứ tự
    let lightness = total > 1 ? 80 - (index / (total - 1)) * 60 : 80;
    return `hsl(0, 100%, ${lightness}%)`;
  } else if (markerColor === 'colorType') {
    // 5 màu cố định
    const colors = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF'];
    return colors[index % colors.length];
  } else if (markerColor === 'custom') {
    return customColorInput.value;
  }
  return 'red';
}

// Hàm cập nhật giao diện các marker lịch sử dựa trên markerStyle và markerColor
function updateHistoryMarkers() {
  historyMarkersContainer.innerHTML = '';
  if (currentBookIndex === null) return;
  const books = getSavedBooks();
  const currentBook = books[currentBookIndex];
  if (!currentBook.history || currentBook.history.length === 0) return;
  
  const containerHeight = contentViewer.clientHeight;
  const maxScroll = contentViewer.scrollHeight - containerHeight;
  
  if (markerStyle === 'aggregation') {
    const threshold = 10;
    let groups = [];
    currentBook.history.forEach((entry) => {
      const markerTop = (entry.pos / maxScroll) * containerHeight;
      if (groups.length === 0) {
        groups.push({ markerTop: markerTop, entries: [entry] });
      } else {
        let lastGroup = groups[groups.length - 1];
        if (Math.abs(markerTop - lastGroup.markerTop) < threshold) {
          lastGroup.entries.push(entry);
          lastGroup.markerTop = (lastGroup.markerTop * (lastGroup.entries.length - 1) + markerTop) / lastGroup.entries.length;
        } else {
          groups.push({ markerTop: markerTop, entries: [entry] });
        }
      }
    });
    groups.forEach((group, index) => {
      const marker = document.createElement('div');
      marker.className = 'history-marker';
      marker.style.top = group.markerTop + 'px';
      marker.style.left = '4px';
      marker.textContent = group.entries.length > 1 ? group.entries.length : index + 1;
      marker.style.backgroundColor = getMarkerColor(index, groups.length);
      const tooltip = document.createElement('div');
      tooltip.className = 'history-tooltip';
      tooltip.innerHTML = group.entries.map((entry, i) => `<div>${i+1}. ${formatTimeAgo(entry.timestamp)}</div>`).join('');
      historyMarkersContainer.appendChild(tooltip);
      marker.addEventListener('mouseenter', () => {
        tooltip.style.top = (group.markerTop - 10) + 'px';
        tooltip.style.left = '-80px';  // Đưa tooltip sát rìa marker
        tooltip.classList.add('show');
      });
      marker.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        contentViewer.scrollTop = group.entries[0].pos;
        updateHistoryMarkers();
      });
      historyMarkersContainer.appendChild(marker);
    });
  } else if (markerStyle === 'combined') {
    currentBook.history.forEach((entry, index) => {
      const marker = document.createElement('div');
      marker.className = 'history-marker';
      const markerTop = (entry.pos / maxScroll) * containerHeight;
      marker.style.top = markerTop + 'px';
      marker.style.left = '4px';
      marker.textContent = index + 1;
      marker.style.backgroundColor = getMarkerColor(index, currentBook.history.length);
      
      let combinedEntries = currentBook.history.filter(e => {
        const posY = (e.pos / maxScroll) * containerHeight;
        return Math.abs(posY - markerTop) < 10;
      });
      
      const tooltip = document.createElement('div');
      tooltip.className = 'history-tooltip';
      tooltip.innerHTML = combinedEntries.map((e, i) => `<div class="tooltip-entry" data-pos="${e.pos}">${i+1}. ${formatTimeAgo(e.timestamp)}</div>`).join('');
      historyMarkersContainer.appendChild(tooltip);
      
      let tooltipTimeout;
      
      marker.addEventListener('mouseenter', () => {
        tooltip.style.top = (markerTop - 10) + 'px';
        tooltip.style.left = '-80px';  // Đưa tooltip sát rìa marker
        tooltip.classList.add('show');
      });
      
      marker.addEventListener('mouseleave', () => {
        tooltipTimeout = setTimeout(() => {
          tooltip.classList.remove('show');
        }, 300);
      });
      
      tooltip.addEventListener('mouseenter', () => {
        clearTimeout(tooltipTimeout);
        tooltip.classList.add('show');
      });
      tooltip.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
      
      tooltip.querySelectorAll('.tooltip-entry').forEach(entryDiv => {
        entryDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          const pos = parseInt(entryDiv.getAttribute('data-pos'));
          contentViewer.scrollTop = pos;
          tooltip.classList.remove('show');
        });
      });
      
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        contentViewer.scrollTop = entry.pos;
        tooltip.classList.remove('show');
        updateHistoryMarkers();
      });
      
      historyMarkersContainer.appendChild(marker);
    });
  } else if (markerStyle === 'expandable') {
    const threshold = 10;
    let groups = [];
    currentBook.history.forEach((entry) => {
      const markerTop = (entry.pos / maxScroll) * containerHeight;
      if (groups.length === 0) {
        groups.push({ markerTop: markerTop, entries: [entry] });
      } else {
        let lastGroup = groups[groups.length - 1];
        if (Math.abs(markerTop - lastGroup.markerTop) < threshold) {
          lastGroup.entries.push(entry);
          lastGroup.markerTop = (lastGroup.markerTop * (lastGroup.entries.length - 1) + markerTop) / lastGroup.entries.length;
        } else {
          groups.push({ markerTop: markerTop, entries: [entry] });
        }
      }
    });
    groups.forEach((group, index) => {
      const marker = document.createElement('div');
      marker.className = 'history-marker';
      marker.style.top = group.markerTop + 'px';
      marker.style.left = '4px';
      marker.textContent = group.entries.length > 1 ? group.entries.length : index + 1;
      marker.style.backgroundColor = getMarkerColor(index, groups.length);
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        let list = group.entries.map((entry, i) => `${i+1}. ${formatTimeAgo(entry.timestamp)}`).join('\n');
        alert("Markers in this group:\n" + list);
      });
      historyMarkersContainer.appendChild(marker);
    });
  } else if (markerStyle === 'offset') {
    currentBook.history.forEach((entry, index) => {
      const marker = document.createElement('div');
      marker.className = 'history-marker';
      const scrollRatio = entry.pos / maxScroll;
      const markerTop = scrollRatio * containerHeight;
      marker.style.top = markerTop + 'px';
      marker.style.left = (index % 2 === 0) ? '4px' : '10px';
      marker.textContent = index + 1;
      marker.style.backgroundColor = getMarkerColor(index, currentBook.history.length);
      const tooltip = document.createElement('div');
      tooltip.className = 'history-tooltip';
      tooltip.innerHTML = `<strong>Welcome back!</strong><br/>Pick up where you left off:<br/><em>${formatTimeAgo(entry.timestamp)}</em>`;
      historyMarkersContainer.appendChild(tooltip);
      marker.addEventListener('mouseenter', () => {
        tooltip.style.top = (markerTop - 10) + 'px';
        tooltip.style.left = '-80px';
        tooltip.classList.add('show');
      });
      marker.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        contentViewer.scrollTop = entry.pos;
        updateHistoryMarkers();
      });
      historyMarkersContainer.appendChild(marker);
    });
  } else {
    // Kiểu default: marker căn giữa theo cách cũ
    currentBook.history.forEach((entry, index) => {
      const marker = document.createElement('div');
      marker.className = 'history-marker';
      const scrollRatio = entry.pos / maxScroll;
      const markerTop = scrollRatio * containerHeight;
      marker.style.top = markerTop + 'px';
      marker.style.left = '4px';
      marker.textContent = index + 1;
      marker.style.backgroundColor = getMarkerColor(index, currentBook.history.length);
      const tooltip = document.createElement('div');
      tooltip.className = 'history-tooltip';
      tooltip.innerHTML = `<strong>Welcome back!</strong><br/>Pick up where you left off:<br/><em>${formatTimeAgo(entry.timestamp)}</em>`;
      historyMarkersContainer.appendChild(tooltip);
      marker.addEventListener('mouseenter', () => {
        tooltip.style.top = (markerTop - 10) + 'px';
        tooltip.style.left = '-80px';
        tooltip.classList.add('show');
      });
      marker.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        contentViewer.scrollTop = entry.pos;
        updateHistoryMarkers();
      });
      historyMarkersContainer.appendChild(marker);
    });
  }
}

// Lắng nghe sự kiện cuộn để cập nhật tiến độ và ghi nhận marker
contentViewer.addEventListener('scroll', () => {
  if (currentBookIndex === null) return;
  const scrollPos = contentViewer.scrollTop;
  updateCurrentBookProgress(scrollPos);
  if (scrollDebounceTimeout) clearTimeout(scrollDebounceTimeout);
  scrollDebounceTimeout = setTimeout(() => {
    recordScrollPosition(scrollPos);
  }, 500);
});

// Hàm ghi nhận vị trí cuộn (marker) vào lịch sử
function recordScrollPosition(scrollPos) {
  let books = getSavedBooks();
  let currentBook = books[currentBookIndex];
  if (!currentBook.history) currentBook.history = [];
  if (currentBook.history.length === 0 || Math.abs(currentBook.history[currentBook.history.length - 1].pos - scrollPos) > 50) {
    currentBook.history.push({ pos: scrollPos, timestamp: Date.now() });
    if (currentBook.history.length > maxHistoryEntries) {
      currentBook.history.shift();
    }
    saveBooks(books);
    updateHistoryMarkers();
  }
}

// Hàm lấy giá trị tham số từ URL (ví dụ: bookIndex)
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Khi trang load, lấy bookIndex từ URL và hiển thị cuốn sách tương ứng
window.addEventListener('load', () => {
  const index = getQueryParam('bookIndex');
  if (index !== null) {
    currentBookIndex = parseInt(index);
    const books = getSavedBooks();
    if (books[currentBookIndex]) {
      displayBook(books[currentBookIndex], currentBookIndex);
    } else {
      alert("Sách không tồn tại");
    }
  } else {
    alert("Không có sách được chọn");
  }
});
