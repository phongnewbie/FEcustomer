// Script cho trang user (index.html)

let allImages = [];

// Load tất cả ảnh khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, starting loadAllImages...');
    
    // Thêm timeout để đảm bảo loading không bị treo mãi
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading.style.display === 'block') {
            console.warn('⚠️ Loading timeout - forcing hide');
            loading.style.display = 'none';
            const errorDiv = document.getElementById('error');
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Lỗi: Timeout khi tải ảnh. Vui lòng kiểm tra Console (F12) hoặc thử lại.';
        }
    }, 10000); // 10 giây timeout
    
    loadAllImages();
    
    // Tìm kiếm khi nhấn Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchImages();
        }
    });
});

// Tải tất cả ảnh
async function loadAllImages() {
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const imageGrid = document.getElementById('imageGrid');
    const noResults = document.getElementById('noResults');
    
    console.log('=== BẮT ĐẦU LOAD ẢNH ===');
    
    // Đảm bảo ẩn các element khác
    loading.style.display = 'block';
    loading.textContent = 'Đang tải...';
    errorDiv.style.display = 'none';
    imageGrid.innerHTML = '';
    noResults.style.display = 'none';
    
    try {
        console.log('Calling getAllImages()...');
        allImages = await getAllImages();
        console.log('getAllImages() completed');
        console.log('Loaded images:', allImages);
        console.log('Number of images:', allImages ? allImages.length : 'NULL');
        
        // Đảm bảo tắt loading
        loading.style.display = 'none';
        
        if (!allImages || !Array.isArray(allImages)) {
            console.error('allImages is not an array:', allImages);
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Lỗi: Dữ liệu không hợp lệ từ API';
            return;
        }
        
        if (allImages.length === 0) {
            console.log('No images found');
            noResults.style.display = 'block';
            noResults.textContent = 'Chưa có ảnh nào.';
        } else {
            console.log('=== KIỂM TRA DỮ LIỆU ẢNH ===');
            // Kiểm tra từng ảnh có URL không
            allImages.forEach((img, index) => {
                const url = img.img || img.url || img.imageUrl || img.avatar || img.image || '';
                console.log(`Image ${index + 1}/${allImages.length}:`, {
                    id: img.id,
                    name: img.name,
                    hasImg: !!img.img,
                    imgValue: img.img ? (img.img.substring(0, 50) + '...') : 'NULL/EMPTY',
                    imgLength: img.img ? img.img.length : 0,
                    hasUrl: !!url,
                    urlLength: url.length,
                    allFields: Object.keys(img),
                    fullData: img
                });
                
                if (!img.img) {
                    console.warn(`⚠️ Image ${index + 1} (${img.name}) KHÔNG có field 'img'!`);
                }
            });
            console.log('=== KẾT THÚC KIỂM TRA ===');
            
            displayImages(allImages);
        }
    } catch (error) {
        console.error('❌ Error in loadAllImages:', error);
        // Đảm bảo tắt loading khi có lỗi
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Lỗi: ' + (error.message || 'Không thể tải ảnh. Vui lòng kiểm tra Console (F12)');
        console.error('Full error:', error);
    }
    
    console.log('=== KẾT THÚC LOAD ẢNH ===');
}

// Tìm kiếm ảnh
async function searchImages() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const imageGrid = document.getElementById('imageGrid');
    const noResults = document.getElementById('noResults');
    
    if (!searchTerm) {
        loadAllImages();
        return;
    }
    
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    imageGrid.innerHTML = '';
    noResults.style.display = 'none';
    
    try {
        const results = await searchImagesByName(searchTerm);
        loading.style.display = 'none';
        
        if (results.length === 0) {
            noResults.style.display = 'block';
            noResults.textContent = 'Không tìm thấy ảnh nào với từ khóa: "' + searchTerm + '"';
        } else {
            displayImages(results);
        }
    } catch (error) {
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Lỗi: ' + error.message;
    }
}

// Hiển thị ảnh - ĐÂY LÀ CHỖ RENDER ẢNH TỪ API
function displayImages(images) {
    const imageGrid = document.getElementById('imageGrid');
    imageGrid.innerHTML = ''; // Xóa tất cả ảnh cũ
    
    images.forEach((image) => {
        // Tạo thẻ div chứa ảnh
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        
        // Tạo thẻ img để hiển thị ảnh
        const img = document.createElement('img');
        
        // ⭐ ĐÂY LÀ CHỖ QUAN TRỌNG: Lấy URL ảnh từ API
        // Lấy từ field 'img' (theo setup MockAPI của bạn)
        const imageUrl = image.img || '';
        
        // ⭐ ĐÂY LÀ CHỖ SET URL CHO ẢNH - ĐÂY LÀ CHỖ HIỂN THỊ ẢNH
        img.src = imageUrl;
        img.alt = image.name || 'Image';
        
        // Xử lý lỗi nếu không load được ảnh
        img.onerror = function() {
            console.error('Lỗi load ảnh:', image.name, 'URL:', imageUrl ? imageUrl.substring(0, 50) : 'RỖNG');
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=';
        };
        
        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info';
        
        const imageName = document.createElement('p');
        imageName.className = 'image-name';
        imageName.textContent = image.name || 'Không có tên';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = '⬇️ Tải về';
        downloadBtn.onclick = () => {
            const url = image.img || image.url || image.imageUrl || image.avatar || image.image || '';
            if (url) {
                downloadImage(url, image.name || 'image');
            } else {
                alert('Không thể tải ảnh: URL không hợp lệ');
            }
        };
        
        imageInfo.appendChild(imageName);
        imageInfo.appendChild(downloadBtn);
        
        imageCard.appendChild(img);
        imageCard.appendChild(imageInfo);
        
        imageGrid.appendChild(imageCard);
    });
    console.log('=== KẾT THÚC HIỂN THỊ ẢNH ===');
}

