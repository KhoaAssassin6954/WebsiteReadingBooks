document.addEventListener('DOMContentLoaded', () => {
    // Lấy chỉ số sách từ tham số URL (ví dụ: ?bookIndex=0)
    const urlParams = new URLSearchParams(window.location.search);
    const bookIndex = urlParams.get('bookIndex');
    
    if (bookIndex === null) {
      alert("Không tìm thấy chỉ số sách.");
      return;
    }
    
    // Lấy danh sách sách từ localStorage
    const savedBooks = JSON.parse(localStorage.getItem('savedBooks')) || [];
    const currentBook = savedBooks[bookIndex];
    
    if (!currentBook) {
      alert("Sách không tồn tại.");
      return;
    }
    
    // Kiểm tra xem sách có chứa chapter không
    if (!currentBook.chapters || currentBook.chapters.length === 0) {
      document.getElementById('chapterList').innerHTML = "<p>Sách này không có chapter nào.</p>";
      return;
    }
    
    // Render danh sách chapter
    const chapterListContainer = document.getElementById('chapterList');
    currentBook.chapters.forEach((chapter, index) => {
      const chapterItem = document.createElement('div');
      chapterItem.className = 'chapter-item';
      chapterItem.textContent = chapter.title || `Chapter ${index + 1}`;
      chapterItem.style.cursor = 'pointer';
      
      // Khi click vào chapter, chuyển sang trang đọc sách (readingBook.html)
      chapterItem.addEventListener('click', () => {
        // Chuyển sang readingBook.html với tham số bookIndex và chapterIndex
        window.location.href = `readingBook.html?bookIndex=${bookIndex}&chapterIndex=${index}`;
      });
      
      chapterListContainer.appendChild(chapterItem);
    });
    
    // Sự kiện cho nút Back: quay về trang uploadBooks (giả sử là uploadBooks.html)
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', () => {
      window.location.href = "uploadBooks.html";
    });
  });
  