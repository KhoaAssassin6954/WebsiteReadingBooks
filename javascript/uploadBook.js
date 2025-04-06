// // Các phần tử DOM
// const importButton = document.getElementById('importButton');
// const fileInput = document.getElementById('fileInput');
// const contentViewer = document.getElementById('contentViewer');
// const historyMarkersContainer = document.getElementById('historyMarkers');
// const bookList = document.getElementById('bookList');

// const savedBooksKey = 'savedBooks';
// let currentBookIndex = null; // Chỉ số của cuốn sách đang mở
// let scrollDebounceTimeout = null;
// const maxHistoryEntries = 5; // Số marker lịch sử tối đa

// // Khi nhấn nút "Nhập file", mở hộp chọn file
// importButton.addEventListener('click', () => fileInput.click());

// // Xử lý khi chọn file
// fileInput.addEventListener('change', (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     const ext = file.name.split('.').pop().toLowerCase();
//     if (ext === 'doc' || ext === 'docx') {
//       // Xử lý file DOC/DOCX bằng mammoth
//       const reader = new FileReader();
//       reader.onload = () => {
//         mammoth.extractRawText({ arrayBuffer: reader.result })
//           .then(result => {
//             const htmlContent = `<pre>${result.value}</pre>`;
//             const book = {
//               name: file.name,
//               type: ext,
//               data: htmlContent,
//               progress: 0,
//               history: [] // Mảng lưu các vị trí đã truy cập
//             };
//             addBook(book);
//             currentBookIndex = getSavedBooks().length - 1;
//             displayBook(book, currentBookIndex);
//           })
//           .catch(error => {
//             console.error("Lỗi khi đọc file DOC/DOCX:", error);
//           });
//       };
//       reader.readAsArrayBuffer(file);
      
//     } else if (ext === 'pdf') {
//       // Đọc file PDF dưới dạng dataURL để lưu vào localStorage
//       const reader = new FileReader();
//       reader.onload = () => {
//         const dataURL = reader.result;
//         const book = {
//           name: file.name,
//           type: ext,
//           data: dataURL,
//           progress: 0,
//           history: []
//         };
//         addBook(book);
//         currentBookIndex = getSavedBooks().length - 1;
//         displayBook(book, currentBookIndex);
//       };
//       reader.readAsDataURL(file);
      
//     } else if (ext === 'txt') {
//       // Đọc file TXT
//       const reader = new FileReader();
//       reader.onload = () => {
//         const textContent = reader.result;
//         const book = {
//           name: file.name,
//           type: ext,
//           data: textContent,
//           progress: 0,
//           history: []
//         };
//         addBook(book);
//         currentBookIndex = getSavedBooks().length - 1;
//         displayBook(book, currentBookIndex);
//       };
//       reader.readAsText(file);
      
//     } else {
//       alert("File không được hỗ trợ. Vui lòng chọn file DOC, DOCX, PDF hoặc TXT.");
//     }
//   }
// });

// // Hàm lấy danh sách sách từ localStorage
// function getSavedBooks() {
//   return JSON.parse(localStorage.getItem(savedBooksKey)) || [];
// }

// // Lưu danh sách sách vào localStorage
// function saveBooks(books) {
//   localStorage.setItem(savedBooksKey, JSON.stringify(books));
// }

// // Thêm cuốn sách mới và cập nhật danh sách hiển thị
// function addBook(book) {
//   const books = getSavedBooks();
//   books.push(book);
//   saveBooks(books);
//   updateBookList();
// }

// // Cập nhật danh sách sách đã lưu
// function updateBookList() {
//   const books = getSavedBooks();
//   bookList.innerHTML = '';
//   books.forEach((book, index) => {
//     const div = document.createElement('div');
//     div.className = 'book-item';
//     // Khi nhấp vào bìa sẽ chuyển đổi sang cuốn sách tương ứng
//     div.addEventListener('click', () => {
//       switchBook(index);
//     });

//     // Tạo thẻ img cho bìa
//     const img = document.createElement('img');
//     if (book.type === 'pdf') {
//       generatePDFThumbnail(book.data).then((dataURL) => {
//         img.src = dataURL;
//       }).catch(err => {
//         console.error("Error generating PDF thumbnail:", err);
//         img.src = generateDefaultCover(book);
//       });
//     } else {
//       img.src = generateDefaultCover(book);
//     }
//     div.appendChild(img);

//     // Tạo nút xoá
//     const deleteBtn = document.createElement('button');
//     deleteBtn.className = 'delete-btn';
//     deleteBtn.textContent = 'X';
//     deleteBtn.addEventListener('click', (e) => {
//       e.stopPropagation();
//       deleteBook(index);
//     });
//     div.appendChild(deleteBtn);

//     bookList.appendChild(div);
//   });
// }


// // Xoá sách theo chỉ số
// function deleteBook(index) {
//   let books = getSavedBooks();
//   books.splice(index, 1);
//   saveBooks(books);
//   if (currentBookIndex === index) {
//     contentViewer.innerHTML = '';
//     historyMarkersContainer.innerHTML = '';
//     currentBookIndex = null;
//   } else if (currentBookIndex > index) {
//     currentBookIndex--;
//   }
//   updateBookList();
// }

// // Chuyển đổi sách: lưu lại progress của cuốn hiện tại rồi chuyển sang cuốn mới
// function switchBook(newIndex) {
//   if (currentBookIndex !== null) {
//     let books = getSavedBooks();
//     if (books[currentBookIndex]) {
//       books[currentBookIndex].progress = contentViewer.scrollTop;
//       saveBooks(books);
//     }
//   }
//   currentBookIndex = newIndex;
//   const books = getSavedBooks();
//   displayBook(books[newIndex], newIndex);
// }

// // Hiển thị nội dung cuốn sách và khôi phục vị trí cuộn cùng với lịch sử marker
// function displayBook(book, index) {
//   contentViewer.innerHTML = '';
//   if (book.type === 'doc' || book.type === 'docx') {
//     contentViewer.innerHTML = book.data;
//   } else if (book.type === 'pdf') {
//     displayPDF(book.data);
//   } else if (book.type === 'txt') {
//     contentViewer.innerHTML = `<pre>${book.data}</pre>`;
//   }
//   // Sau khi nội dung load, khôi phục vị trí cuộn và cập nhật marker lịch sử
//   setTimeout(() => {
//     contentViewer.scrollTop = book.progress;
//     updateHistoryMarkers();
//   }, 100);
// }

// // Hàm render file PDF sử dụng pdf.js (dataURL)
// function displayPDF(data) {
//   pdfjsLib.getDocument(data).promise.then((pdfDoc) => {
//     contentViewer.innerHTML = '';
//     for (let i = 1; i <= pdfDoc.numPages; i++) {
//       pdfDoc.getPage(i).then((page) => {
//         const viewport = page.getViewport({ scale: 1.5 });
//         const canvas = document.createElement('canvas');
//         const context = canvas.getContext('2d');
//         canvas.height = viewport.height;
//         canvas.width = viewport.width;
//         contentViewer.appendChild(canvas);
//         page.render({ canvasContext: context, viewport: viewport });
//       });
//     }
//   });
// }

// // Theo dõi sự kiện cuộn để cập nhật progress và lưu lại vị trí lịch sử
// contentViewer.addEventListener('scroll', () => {
//   if (currentBookIndex === null) return;
//   const scrollPos = contentViewer.scrollTop;
//   updateCurrentBookProgress(scrollPos);
//   updateHistoryMarkers();
//   if (scrollDebounceTimeout) clearTimeout(scrollDebounceTimeout);
//   scrollDebounceTimeout = setTimeout(() => {
//     recordScrollPosition(scrollPos);
//   }, 500);
// });

// // Cập nhật progress của cuốn sách hiện tại vào localStorage
// function updateCurrentBookProgress(scrollPos) {
//   const books = getSavedBooks();
//   if (currentBookIndex !== null && books[currentBookIndex]) {
//     books[currentBookIndex].progress = scrollPos;
//     saveBooks(books);
//   }
// }

// // Ghi nhận vị trí cuộn (scroll position) vào lịch sử của cuốn sách hiện tại
// function recordScrollPosition(scrollPos) {
//   let books = getSavedBooks();
//   let currentBook = books[currentBookIndex];
//   if (!currentBook.history) {
//     currentBook.history = [];
//   }
//   // Chỉ ghi nhận nếu chênh lệch hơn 50px so với marker cuối cùng
//   if (currentBook.history.length === 0 || Math.abs(currentBook.history[currentBook.history.length - 1].pos - scrollPos) > 50) {
//     currentBook.history.push({ pos: scrollPos, timestamp: Date.now() });
//     if (currentBook.history.length > maxHistoryEntries) {
//       currentBook.history.shift();
//     }
//     saveBooks(books);
//     updateHistoryMarkers();
//   }
// }

// // Cập nhật giao diện của các marker lịch sử trên thanh cuộn
// function updateHistoryMarkers() {
//   historyMarkersContainer.innerHTML = '';
//   if (currentBookIndex === null) return;
//   let books = getSavedBooks();
//   let currentBook = books[currentBookIndex];
//   if (!currentBook.history || currentBook.history.length === 0) return;
//   const containerHeight = contentViewer.clientHeight;
//   const maxScroll = contentViewer.scrollHeight - containerHeight;
  
//   // Duyệt qua các marker đã lưu (theo thứ tự từ cũ đến mới)
//   currentBook.history.forEach((entry, index) => {
//     const marker = document.createElement('div');
//     marker.className = 'history-marker';
//     const scrollRatio = entry.pos / maxScroll;
//     const markerTop = scrollRatio * containerHeight;
//     marker.style.top = markerTop + 'px';
//     // Màu marker biểu thị độ "mới" (marker mới nhất có độ đậm cao hơn)
//     const alpha = 0.5 + 0.5 * ((index + 1) / currentBook.history.length);
//     marker.style.backgroundColor = `rgba(255, 0, 0, ${alpha})`;
//     marker.textContent = index + 1;
//     // Nhấp vào marker sẽ chuyển đến vị trí đã ghi nhận
//     marker.addEventListener('click', (e) => {
//       e.stopPropagation();
//       contentViewer.scrollTop = entry.pos;
//       updateHistoryMarkers();
//     });
//     historyMarkersContainer.appendChild(marker);
//   });
// }

// /*  
// So sánh (theo lý thuyết):
// - Thanh cuộn tiêu chuẩn: Người dùng phải kéo thanh cuộn dài và điều chỉnh vị trí thủ công.
// - Thanh cuộn có lịch sử: Người dùng chỉ cần nhấp vào một marker để nhảy thẳng đến vị trí đã ghé thăm trước đó, tiết kiệm thời gian điều hướng.
// */

// window.addEventListener('load', updateBookList);

// // Tạo ảnh bìa mặc định cho các file không phải PDF
// function generateDefaultCover(book) {
//   // Lấy tối đa 10 ký tự đầu của tên sách để hiển thị
//   const text = book.name ? book.name.substring(0, 10) : "Book";
//   const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180">
//     <rect width="120" height="180" fill="#ccc"/>
//     <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#333" font-family="Arial">${text}</text>
//     </svg>`;
//   return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
// }

// // Tạo thumbnail cho file PDF
// function generatePDFThumbnail(data) {
//   return pdfjsLib.getDocument(data).promise.then(pdfDoc => {
//     return pdfDoc.getPage(1).then(page => {
//       const scale = 0.5; // scale nhỏ để làm thumbnail
//       const viewport = page.getViewport({ scale: scale });
//       const canvas = document.createElement('canvas');
//       canvas.width = viewport.width;
//       canvas.height = viewport.height;
//       const context = canvas.getContext('2d');
//       const renderContext = {
//         canvasContext: context,
//         viewport: viewport
//       };
//       return page.render(renderContext).promise.then(() => {
//         return canvas.toDataURL();
//       });
//     });
//   });
// }


// uploadBook.js cho trang uploadBook

// Các phần tử DOM
const importButton = document.getElementById('importButton');
const fileInput = document.getElementById('fileInput');
const bookList = document.getElementById('bookList');

const coverModal = document.getElementById('coverModal');
const modalCoverInput = document.getElementById('modalCoverInput');
const modalClose = document.querySelector('.modal .close');

const savedBooksKey = 'savedBooks';
let selectedBookIndex = null; // chỉ số sách được chọn để chỉnh sửa bìa

// Khi nhấn "Import", mở hộp chọn file sách
importButton.addEventListener('click', () => fileInput.click());

// Xử lý khi chọn file sách
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'doc' || ext === 'docx') {
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

// Lấy danh sách sách từ localStorage
function getSavedBooks() {
  return JSON.parse(localStorage.getItem(savedBooksKey)) || [];
}

// Lưu danh sách sách vào localStorage
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

// Cập nhật danh sách sách (hiển thị dạng bìa)
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
    
    // Nút Delete để xoá sách
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBook(index);
    });
    li.appendChild(deleteBtn);
    
    // Nút Edit để thay đổi ảnh bìa
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
