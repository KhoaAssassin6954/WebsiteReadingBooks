// Các phần tử DOM
const importButton = document.getElementById('importButton');
const fileInput = document.getElementById('fileInput');
const contentViewer = document.getElementById('contentViewer');
const historyMarkersContainer = document.getElementById('historyMarkers');
const bookList = document.getElementById('bookList');

const savedBooksKey = 'savedBooks';
let currentBookIndex = null; // Chỉ số của cuốn sách đang mở
let scrollDebounceTimeout = null;
const maxHistoryEntries = 5; // Số marker lịch sử tối đa

// Khi nhấn nút "Nhập sách", mở hộp chọn file
importButton.addEventListener('click', () => fileInput.click());

// Xử lý khi chọn file
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'doc' || ext === 'docx') {
      // Xử lý file DOC/DOCX bằng mammoth
      const reader = new FileReader();
      reader.onload = () => {
        mammoth.extractRawText({ arrayBuffer: reader.result })
          .then(result => {
            const htmlContent = `<pre>${result.value}</pre>`;
            const book = {
              name: file.name,
              type: ext,
              data: htmlContent,
              progress: 0,
              history: []
            };
            addBook(book);
            currentBookIndex = getSavedBooks().length - 1;
            displayBook(book, currentBookIndex);
          })
          .catch(error => {
            console.error("Lỗi khi đọc file DOC/DOCX:", error);
          });
      };
      reader.readAsArrayBuffer(file);
      
    } else if (ext === 'pdf') {
      // Đọc file PDF dưới dạng dataURL để lưu vào localStorage
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result;
        const book = {
          name: file.name,
          type: ext,
          data: dataURL,
          progress: 0,
          history: []
        };
        addBook(book);
        currentBookIndex = getSavedBooks().length - 1;
        displayBook(book, currentBookIndex);
      };
      reader.readAsDataURL(file);
      
    } else if (ext === 'txt') {
      // Đọc file TXT
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = reader.result;
        const book = {
          name: file.name,
          type: ext,
          data: textContent,
          progress: 0,
          history: []
        };
        addBook(book);
        currentBookIndex = getSavedBooks().length - 1;
        displayBook(book, currentBookIndex);
      };
      reader.readAsText(file);
      
    } else {
      alert("File không được hỗ trợ. Vui lòng chọn file DOC, DOCX, PDF hoặc TXT.");
    }
  }
});

// Hàm lấy danh sách sách từ localStorage
function getSavedBooks() {
  return JSON.parse(localStorage.getItem(savedBooksKey)) || [];
}

// Hàm lưu danh sách sách vào localStorage
function saveBooks(books) {
  localStorage.setItem(savedBooksKey, JSON.stringify(books));
}

// Thêm cuốn sách mới và cập nhật danh sách hiển thị
function addBook(book) {
  const books = getSavedBooks();
  books.push(book);
  saveBooks(books);
  updateBookList();
}

// Cập nhật danh sách sách đã lưu
function updateBookList() {
  const books = getSavedBooks();
  bookList.innerHTML = '';
  books.forEach((book, index) => {
    const li = document.createElement('li');
    li.className = 'book-item';
    li.addEventListener('click', () => {
      switchBook(index);
    });
    const span = document.createElement('span');
    span.textContent = book.name;
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Xoá';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBook(index);
    });
    li.appendChild(span);
    li.appendChild(deleteBtn);
    bookList.appendChild(li);
  });
}

// Xoá sách theo chỉ số
function deleteBook(index) {
  let books = getSavedBooks();
  books.splice(index, 1);
  saveBooks(books);
  if (currentBookIndex === index) {
    contentViewer.innerHTML = '';
    historyMarkersContainer.innerHTML = '';
    currentBookIndex = null;
  } else if (currentBookIndex > index) {
    currentBookIndex--;
  }
  updateBookList();
}

// Chuyển đổi sách: lưu lại tiến trình của cuốn hiện tại rồi chuyển sang cuốn mới
function switchBook(newIndex) {
  if (currentBookIndex !== null) {
    let books = getSavedBooks();
    if (books[currentBookIndex]) {
      books[currentBookIndex].progress = contentViewer.scrollTop;
      saveBooks(books);
    }
  }
  currentBookIndex = newIndex;
  const books = getSavedBooks();
  displayBook(books[newIndex], newIndex);
}

// Hiển thị nội dung cuốn sách và khôi phục vị trí cuộn cùng với marker lịch sử
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
    contentViewer.scrollTop = book.progress;
    updateHistoryMarkers();
  }, 100);
}

// Hàm render file PDF sử dụng pdf.js (với dataURL)
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

// Theo dõi sự kiện cuộn để cập nhật tiến trình và lưu marker lịch sử
contentViewer.addEventListener('scroll', () => {
  if (currentBookIndex === null) return;
  const scrollPos = contentViewer.scrollTop;
  updateCurrentBookProgress(scrollPos);
  updateHistoryMarkers();
  if (scrollDebounceTimeout) clearTimeout(scrollDebounceTimeout);
  scrollDebounceTimeout = setTimeout(() => {
    recordScrollPosition(scrollPos);
  }, 500);
});

// Cập nhật tiến trình của cuốn sách hiện tại vào localStorage
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
  if (currentBook.history.length === 0 || Math.abs(currentBook.history[currentBook.history.length - 1].pos - scrollPos) > 50) {
    currentBook.history.push({ pos: scrollPos, timestamp: Date.now() });
    if (currentBook.history.length > maxHistoryEntries) {
      currentBook.history.shift();
    }
    saveBooks(books);
    updateHistoryMarkers();
  }
}

// Cập nhật giao diện marker lịch sử dựa trên tiến trình cuộn
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
    const scrollRatio = entry.pos / maxScroll;
    const markerTop = scrollRatio * containerHeight;
    marker.style.top = markerTop + 'px';
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

window.addEventListener('load', updateBookList);
