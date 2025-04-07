// File: readingBook.js

// Lấy các phần tử DOM cần thiết
const backButton = document.getElementById('backButton');
const contentViewer = document.getElementById('contentViewer');
const historyMarkersContainer = document.getElementById('historyMarkers');

// Các biến toàn cục
let currentBookIndex = null;
let scrollDebounceTimeout = null;
const maxHistoryEntries = 5;

// Sự kiện cho nút Back: quay về trang uploadBook
backButton.addEventListener('click', () => {
  window.location.href = "uploadBook.html";
});

// Hàm lấy danh sách sách từ localStorage (giả sử dữ liệu được lưu với key 'savedBooks')
function getSavedBooks() {
  return JSON.parse(localStorage.getItem('savedBooks')) || [];
}

// Hàm lưu danh sách sách vào localStorage
function saveBooks(books) {
  localStorage.setItem('savedBooks', JSON.stringify(books));
}

// Hàm chuyển đổi timestamp sang chuỗi thời gian dạng "x minutes/hours/days ago"
function formatTimeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return diffSec + ' seconds ago';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return diffMin + ' minutes ago';
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return diffHr + ' hours ago';
  }
  const diffDay = Math.floor(diffHr / 24);
  return diffDay + ' days ago';
}

// Hàm hiển thị nội dung sách
function displayBook(book, index) {
  contentViewer.innerHTML = '';
  if (book.type === 'doc' || book.type === 'docx') {
    // Nội dung đã được chuyển đổi sang HTML
    contentViewer.innerHTML = book.data;
  } else if (book.type === 'pdf') {
    displayPDF(book.data);
  } else if (book.type === 'txt') {
    contentViewer.innerHTML = `<pre>${book.data}</pre>`;
  }
  // Sau khi nội dung load, khôi phục vị trí cuộn (nếu có) và cập nhật marker lịch sử
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

// Hàm cập nhật tiến độ đọc (scroll position) vào localStorage
function updateCurrentBookProgress(scrollPos) {
  const books = getSavedBooks();
  if (currentBookIndex !== null && books[currentBookIndex]) {
    books[currentBookIndex].progress = scrollPos;
    saveBooks(books);
  }
}

// Hàm ghi nhận vị trí cuộn vào lịch sử của cuốn sách (record marker)
function recordScrollPosition(scrollPos) {
  let books = getSavedBooks();
  let currentBook = books[currentBookIndex];
  if (!currentBook.history) {
    currentBook.history = [];
  }
  // Chỉ ghi nhận nếu khoảng cách từ marker cuối cùng > 50px
  if (currentBook.history.length === 0 || Math.abs(currentBook.history[currentBook.history.length - 1].pos - scrollPos) > 50) {
    currentBook.history.push({ pos: scrollPos, timestamp: Date.now() });
    if (currentBook.history.length > maxHistoryEntries) {
      currentBook.history.shift();
    }
    saveBooks(books);
    updateHistoryMarkers();
  }
}

// Hàm cập nhật giao diện các marker lịch sử (bao gồm popup)
function updateHistoryMarkers() {
  historyMarkersContainer.innerHTML = '';
  if (currentBookIndex === null) return;
  const books = getSavedBooks();
  const currentBook = books[currentBookIndex];
  if (!currentBook.history || currentBook.history.length === 0) return;
  
  const containerHeight = contentViewer.clientHeight;
  const maxScroll = contentViewer.scrollHeight - containerHeight;
  
  currentBook.history.forEach((entry, index) => {
    // Tạo marker
    const marker = document.createElement('div');
    marker.className = 'history-marker';
    const scrollRatio = entry.pos / maxScroll;
    const markerTop = scrollRatio * containerHeight;
    marker.style.top = markerTop + 'px';
    const alpha = 0.5 + 0.5 * ((index + 1) / currentBook.history.length);
    marker.style.backgroundColor = `rgba(255, 0, 0, ${alpha})`;
    
    // Tạo popup tooltip hiển thị thông tin
    const tooltip = document.createElement('div');
    tooltip.className = 'history-tooltip';
    const timeAgo = formatTimeAgo(entry.timestamp);
    tooltip.innerHTML = `<strong>Welcome back!</strong><br/>Pick up where you left off:<br/><em>${timeAgo}</em>`;
    
    // Đặt tooltip bên ngoài marker (vị trí sẽ được điều chỉnh theo marker)
    historyMarkersContainer.appendChild(tooltip);
    
    // Khi di chuột vào marker, hiển thị tooltip
    marker.addEventListener('mouseenter', () => {
      tooltip.style.top = (markerTop - 10) + 'px';  // Điều chỉnh vị trí tooltip theo marker
      tooltip.style.left = '-210px'; // Đẩy tooltip sang bên trái (có thể điều chỉnh lại)
      tooltip.classList.add('show');
    });
    marker.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });
    
    // Khi nhấp vào marker, cuộn đến vị trí đã lưu
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      contentViewer.scrollTop = entry.pos;
      updateHistoryMarkers();
    });
    
    historyMarkersContainer.appendChild(marker);
  });
}

// Lắng nghe sự kiện cuộn để cập nhật progress và ghi nhận vị trí lịch sử
contentViewer.addEventListener('scroll', () => {
  if (currentBookIndex === null) return;
  const scrollPos = contentViewer.scrollTop;
  updateCurrentBookProgress(scrollPos);
  if (scrollDebounceTimeout) clearTimeout(scrollDebounceTimeout);
  scrollDebounceTimeout = setTimeout(() => {
    recordScrollPosition(scrollPos);
  }, 500);
});

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


const chapterIndex = new URLSearchParams(window.location.search).get('chapterIndex');
if (chapterIndex !== null && currentBook.chapters) {
  // Hiển thị nội dung chapter
  contentViewer.innerHTML = currentBook.chapters[chapterIndex].content;
} else {
  // Hiển thị toàn bộ nội dung sách
  displayBook(currentBook);
}
