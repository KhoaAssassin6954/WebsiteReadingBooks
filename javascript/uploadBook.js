const importButton = document.getElementById('importButton');
const fileInput = document.getElementById('fileInput');
const bookList = document.getElementById('bookList');

const coverModal = document.getElementById('coverModal');
const modalCoverInput = document.getElementById('modalCoverInput');
const modalClose = document.querySelector('.modal .close');

const savedBooksKey = 'savedBooks';
let selectedBookIndex = null; 

// Press IMport to open file input
importButton.addEventListener('click', () => fileInput.click());

// Xử lý khi chọn file sách
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'doc' || ext === 'docx') {
      const reader = new FileReader(); //comvert docx to html
      // Sử dụng thư viện mammoth.js để chuyển đổi DOCX sang HTML
      reader.onload = () => { 
        mammoth.extractRawText({ arrayBuffer: reader.result })
          .then(result => {
            const htmlContent = `<pre>${result.value}</pre>`;
            const book = {
              name: file.name,
              type: ext,
              data: htmlContent,
              progress: 0,
              history: [],
              cover: null  // chưa có ảnh bìa
            };
            addBook(book);
          })
          .catch(error => {
            console.error("Lỗi khi đọc file DOC/DOCX:", error);
          });
      };
      reader.readAsArrayBuffer(file);
      // Chuyển đổi file DOCX sang ArrayBuffer để sử dụng với mammoth.js
    } else if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result;
        const book = {
          name: file.name,
          type: ext,
          data: dataURL,
          progress: 0,
          history: [],
          cover: null
        };
        addBook(book);
      };
      reader.readAsDataURL(file);
      
    } else if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = reader.result;
        const book = {
          name: file.name,
          type: ext,
          data: textContent,
          progress: 0,
          history: [],
          cover: null
        };
        addBook(book);
      };
      reader.readAsText(file);
      
    } else {
      alert("File không được hỗ trợ. Vui lòng chọn file DOC, DOCX, PDF hoặc TXT.");
    }
  }
});

// Get book from localStorage
function getSavedBooks() {
  return JSON.parse(localStorage.getItem(savedBooksKey)) || [];
}

// Save book localStorage
function saveBooks(books) {
  localStorage.setItem(savedBooksKey, JSON.stringify(books));
}

// Add new book to localStorage and update the list
function addBook(book) {
  const books = getSavedBooks();
  books.push(book);
  saveBooks(books);
  updateBookList();
}

// Update the book list in the UI cover
function updateBookList() {
  const books = getSavedBooks();
  bookList.innerHTML = '';
  books.forEach((book, index) => {
    const li = document.createElement('li');
    li.className = 'book-item';
    
    // Khi click vào toàn bộ mục sách, chuyển sang trang readingBook
    li.addEventListener('click', () => {
      window.location.href = `readingBook.html?bookIndex=${index}`;
    });
    
    // Tạo thẻ img hiển thị bìa sách
    const img = document.createElement('img');
    if (book.cover) {
      img.src = book.cover;
    } else {
      if (book.type === 'pdf') {
        generatePDFThumbnail(book.data)
          .then((dataURL) => { img.src = dataURL; })
          .catch(err => {
            console.error("Error generating PDF thumbnail:", err);
            img.src = generateDefaultCover(book);
          });
      } else {
        img.src = generateDefaultCover(book);
      }
    }
    li.appendChild(img);
    
    // Delete button to remove book
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBook(index);
    });
    li.appendChild(deleteBtn);
    
    // Edite button to edit book cover
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCoverModal(index);
    });
    li.appendChild(editBtn);
    
    bookList.appendChild(li);
  });
}




// Xoá sách theo chỉ số
function deleteBook(index) {
  let books = getSavedBooks();
  books.splice(index, 1);
  saveBooks(books);
  updateBookList();
}

// Hàm tạo ảnh bìa mặc định (dùng SVG với tên sách)
function generateDefaultCover(book) {
  const text = book.name ? book.name.substring(0, 10) : "Book";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180">
    <rect width="120" height="180" fill="#ccc"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#333" font-family="Arial">${text}</text>
    </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Hàm tạo thumbnail cho file PDF (sử dụng pdf.js)
function generatePDFThumbnail(data) {
  return pdfjsLib.getDocument(data).promise.then(pdfDoc => {
    return pdfDoc.getPage(1).then(page => {
      const scale = 0.5; // scale nhỏ để tạo thumbnail
      const viewport = page.getViewport({ scale: scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      return page.render(renderContext).promise.then(() => {
        return canvas.toDataURL();
      });
    });
  });
}

/* ===== Xử lý modal cho thay đổi ảnh bìa ===== */

// Mở modal và lưu lại chỉ số sách cần chỉnh sửa
function openCoverModal(index) {
  selectedBookIndex = index;
  coverModal.style.display = "block";
  // Reset file input modal nếu cần
  modalCoverInput.value = "";
}

// Khi người dùng chọn ảnh từ modal, cập nhật ảnh bìa của sách
modalCoverInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && selectedBookIndex !== null) {
    const reader = new FileReader();
    reader.onload = () => {
      let books = getSavedBooks();
      books[selectedBookIndex].cover = reader.result;
      saveBooks(books);
      updateBookList();
      closeModal();
    };
    reader.readAsDataURL(file);
  }
});

// Xử lý đóng modal khi nhấn dấu "×"
modalClose.addEventListener('click', () => {
  closeModal();
});

function closeModal() {
  coverModal.style.display = "none";
  selectedBookIndex = null;
}

// Đóng modal nếu người dùng click ngoài vùng modal-content
window.addEventListener('click', (event) => {
  if (event.target == coverModal) {
    closeModal();
  }
});

window.addEventListener('load', updateBookList);


