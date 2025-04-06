// readingBook.js

// Các phần tử DOM
const backButton = document.getElementById('backButton');
const contentViewer = document.getElementById('contentViewer');
const historyMarkersContainer = document.getElementById('historyMarkers');

const savedBooksKey = 'savedBooks';
let currentBookIndex = null;
let scrollDebounceTimeout = null;
const maxHistoryEntries = 5;

// Nút Back chuyển về trang uploadBook
backButton.addEventListener('click', () => {
  window.location.href = "uploadBook.html";
});

// Lấy danh sách sách từ localStorage
function getSavedBooks() {
  return JSON.parse(localStorage.getItem(savedBooksKey)) || [];
}

// Lưu danh sách sách vào localStorage
function saveBooks(books) {
  localStorage.setItem(savedBooksKey, JSON.stringify(books));
}

// Hiển thị nội dung sách trong khu vực đọc
function displayBook(book, index) {
  contentViewer.innerHTML = '';
  if (book.type === 'doc' || book.type === 'docx') {
    contentViewer.innerHTML = book.data;
  } else if (book.type === 'pdf') {
    displayPDF(book.data);
  } else if (book.type === 'txt') {
    contentViewer.innerHTML = `<pre>${book.data}</pre>`;
  }
  // Sau khi nội dung load, khôi phục vị trí cuộn và cập nhật marker lịch sử
  setTimeout(() => {
    contentViewer.scrollTop = book.progress;
    updateHistoryMarkers();
  }, 100);
}

// Render file PDF sử dụng pdf.js
function displayPDF(data) {
  pdfjsLib.getDocument(data).promise.then((pdfDoc) => {
    contentViewer.innerHTML = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      pdfDoc.getPage(i).then((page) => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        contentViewer.appendChild(canvas);
        page.render({ canvasContext: context, viewport: viewport });
      });
    }
  });
}

// Cập nhật progress của sách hiện tại vào localStorage
function updateCurrentBookProgress(scrollPos) {
  const books = getSavedBooks();
  if (currentBookIndex !== null && books[currentBookIndex]) {
    books[currentBookIndex].progress = scrollPos;
    saveBooks(books);
  }
}

// Ghi nhận vị trí cuộn vào lịch sử của cuốn sách
function recordScrollPosition(scrollPos) {
  let books = getSavedBooks();
  let currentBook = books[currentBookIndex];
  if (!currentBook.history) {
    currentBook.history = [];
  }
  // Chỉ ghi nhận nếu chênh lệch hơn 50px so với marker cuối cùng
  if (currentBook.history.length === 0 || Math.abs(currentBook.history[currentBook.history.length - 1].pos - scrollPos) > 50) {
    currentBook.history.push({ pos: scrollPos, timestamp: Date.now() });
    if (currentBook.history.length > maxHistoryEntries) {
      currentBook.history.shift();
    }
    saveBooks(books);
    updateHistoryMarkers();
  }
}

// Cập nhật giao diện các marker lịch sử trên vùng có scrollbar mặc định
function updateHistoryMarkers() {
  historyMarkersContainer.innerHTML = '';
  if (currentBookIndex === null) return;
  let books = getSavedBooks();
  let currentBook = books[currentBookIndex];
  if (!currentBook.history || currentBook.history.length === 0) return;
  
  const containerHeight = contentViewer.clientHeight;
  const maxScroll = contentViewer.scrollHeight - containerHeight;
  
  currentBook.history.forEach((entry, index) => {
    const marker = document.createElement('div');
    marker.className = 'history-marker';
    // Tính toán vị trí marker theo tỷ lệ vị trí cuộn
    const scrollRatio = entry.pos / maxScroll;
    const markerTop = scrollRatio * containerHeight;
    marker.style.top = markerTop + 'px';
    // Dùng độ trong suốt (alpha) biểu thị thứ tự, marker mới nhất đậm hơn
    const alpha = 0.5 + 0.5 * ((index + 1) / currentBook.history.length);
    marker.style.backgroundColor = `rgba(255, 0, 0, ${alpha})`;
    marker.textContent = index + 1;
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      contentViewer.scrollTop = entry.pos;
      updateHistoryMarkers();
    });
    historyMarkersContainer.appendChild(marker);
  });
}

// Theo dõi sự kiện cuộn để cập nhật progress và ghi nhận lịch sử
contentViewer.addEventListener('scroll', () => {
  if (currentBookIndex === null) return;
  const scrollPos = contentViewer.scrollTop;
  updateCurrentBookProgress(scrollPos);
  if (scrollDebounceTimeout) clearTimeout(scrollDebounceTimeout);
  scrollDebounceTimeout = setTimeout(() => {
    recordScrollPosition(scrollPos);
  }, 500);
});

// Lấy tham số bookIndex từ URL và hiển thị sách tương ứng
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

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
