// Script cho trang admin (admin.html)

let allImages = [];
let selectedFiles = []; // Danh sách file đã chọn để upload

// Load tất cả ảnh khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    loadAllImages();
    setupUpload();
});

// Setup upload functionality
function setupUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // Click để chọn file
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        addFilesToPreview(files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        addFilesToPreview(files);
    });
}

// Thêm files vào preview
function addFilesToPreview(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showUploadError('Vui lòng chọn file ảnh!');
        return;
    }
    
    // Thêm vào danh sách đã chọn
    imageFiles.forEach(file => {
        // Kiểm tra xem file đã có chưa
        const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            selectedFiles.push(file);
        }
    });
    
    updatePreview();
    showUploadError(''); // Clear error
}

// Cập nhật preview
function updatePreview() {
    const previewSection = document.getElementById('previewSection');
    const previewGrid = document.getElementById('previewGrid');
    const previewCount = document.getElementById('previewCount');
    
    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }
    
    previewSection.style.display = 'block';
    previewCount.textContent = selectedFiles.length;
    previewGrid.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        
        const previewInfo = document.createElement('div');
        previewInfo.className = 'preview-info';
        
        const fileName = document.createElement('p');
        fileName.className = 'preview-name';
        fileName.textContent = file.name;
        fileName.title = file.name;
        
        const fileSize = document.createElement('p');
        fileSize.className = 'preview-size';
        fileSize.textContent = formatFileSize(file.size);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-preview-btn';
        removeBtn.textContent = '✖️';
        removeBtn.title = 'Xóa ảnh này';
        removeBtn.onclick = () => removeFileFromPreview(index);
        
        previewInfo.appendChild(fileName);
        previewInfo.appendChild(fileSize);
        
        previewItem.appendChild(img);
        previewItem.appendChild(previewInfo);
        previewItem.appendChild(removeBtn);
        
        previewGrid.appendChild(previewItem);
    });
}

// Xóa file khỏi preview
function removeFileFromPreview(index) {
    selectedFiles.splice(index, 1);
    updatePreview();
}

// Xóa tất cả preview
function clearPreview() {
    selectedFiles = [];
    updatePreview();
    document.getElementById('fileInput').value = '';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Upload tất cả ảnh đã chọn
async function uploadSelectedImages() {
    if (selectedFiles.length === 0) {
        showUploadError('Vui lòng chọn ít nhất một ảnh!');
        return;
    }
    
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadError = document.getElementById('uploadError');
    uploadProgress.style.display = 'block';
    uploadError.style.display = 'none';
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        uploadProgress.textContent = `Đang upload ${i + 1}/${selectedFiles.length}: ${file.name}`;
        
        try {
            // Tự động lấy tên từ file (bỏ extension)
            const imageName = file.name.replace(/\.[^/.]+$/, "");
            
            await uploadImage(file, imageName || `image_${Date.now()}`);
            successCount++;
        } catch (error) {
            console.error('Upload error:', error);
            failCount++;
        }
    }
    
    uploadProgress.style.display = 'none';
    
    if (successCount > 0) {
        alert(`✅ Upload thành công ${successCount} ảnh${failCount > 0 ? `\n❌ ${failCount} ảnh thất bại` : ''}`);
        clearPreview();
        loadAllImages();
    } else {
        showUploadError(`Upload thất bại: ${failCount} ảnh`);
    }
}

// Hiển thị lỗi upload
function showUploadError(message) {
    const uploadError = document.getElementById('uploadError');
    if (!message || message.trim() === '') {
        uploadError.style.display = 'none';
        return;
    }
    uploadError.style.display = 'block';
    uploadError.textContent = message;
    setTimeout(() => {
        uploadError.style.display = 'none';
    }, 5000);
}

// Tải tất cả ảnh
async function loadAllImages() {
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const imageList = document.getElementById('imageList');
    
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    imageList.innerHTML = '';
    
    try {
        allImages = await getAllImages();
        loading.style.display = 'none';
        
        if (allImages.length === 0) {
            imageList.innerHTML = '<p class="empty-message">Chưa có ảnh nào.</p>';
        } else {
            displayImages(allImages);
        }
    } catch (error) {
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Lỗi: ' + error.message;
    }
}

// Hiển thị danh sách ảnh - ĐÂY LÀ CHỖ RENDER ẢNH TỪ API CHO ADMIN
function displayImages(images) {
    const imageList = document.getElementById('imageList');
    imageList.innerHTML = ''; // Xóa tất cả ảnh cũ
    
    images.forEach((image) => {
        // Tạo thẻ div chứa ảnh
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
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
        
        const imageDetails = document.createElement('div');
        imageDetails.className = 'image-details';
        
        const imageName = document.createElement('p');
        imageName.className = 'image-name';
        imageName.textContent = image.name || 'Không có tên';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️ Xóa';
        deleteBtn.onclick = () => deleteImageConfirm(image.id, image.name);
        
        imageDetails.appendChild(imageName);
        imageDetails.appendChild(deleteBtn);
        
        imageItem.appendChild(img);
        imageItem.appendChild(imageDetails);
        
        imageList.appendChild(imageItem);
    });
}

// Xác nhận xóa ảnh
async function deleteImageConfirm(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa ảnh "${name}"?`)) {
        return;
    }
    
    try {
        await deleteImage(id);
        alert('Xóa ảnh thành công!');
        loadAllImages();
    } catch (error) {
        alert('Lỗi khi xóa ảnh: ' + error.message);
    }
}

