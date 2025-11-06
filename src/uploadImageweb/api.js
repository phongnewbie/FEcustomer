// Cấu hình MockAPI
// Bạn cần tạo một MockAPI endpoint tại https://mockapi.io
// Sau đó thay thế API_URL bằng endpoint của bạn
const API_URL = 'https://6309f78a32499100327e5878.mockapi.io/QLND';

// Các hàm xử lý API

// Cấu hình Cloudinary (Unsigned Upload)
// Thay thế bằng thông tin của bạn trong trang Cloudinary Dashboard
const CLOUDINARY_CLOUD_NAME = 'dy696quxi';
const CLOUDINARY_UPLOAD_PRESET = 'customer';

// Lấy tất cả ảnh
async function getAllImages() {
    try {
        console.log('Fetching images from:', API_URL);
        const response = await fetch(API_URL);
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Không thể tải danh sách ảnh: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Is array?', Array.isArray(data));
        console.log('Data length:', data.length);
        
        if (!Array.isArray(data)) {
            console.warn('API không trả về array, data:', data);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
}

// Lấy ảnh theo ID
async function getImageById(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Không thể tải ảnh');
        return await response.json();
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

// Upload ảnh mới (Cloudinary unsigned) rồi lưu URL vào MockAPI
async function uploadImage(imageFile, imageName) {
    try {
        console.log('=== BẮT ĐẦU UPLOAD (Cloudinary) ===');

        if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME' ||
            !CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UNSIGNED_PRESET') {
            throw new Error('Thiếu cấu hình Cloudinary. Vui lòng đặt CLOUDINARY_CLOUD_NAME và CLOUDINARY_UPLOAD_PRESET trong api.js');
        }

        // Kiểm tra loại file cơ bản
        if (!imageFile || !imageFile.type || !imageFile.type.startsWith('image/')) {
            console.error('File không phải ảnh hợp lệ:', { name: imageFile?.name, type: imageFile?.type });
            throw new Error('File không phải ảnh hợp lệ');
        }

        // 1) Kiểm tra trùng trước khi upload (dựa trên hash + tên)
        const hashHex = await sha256FileHex(imageFile);
        console.log('SHA-256 hash:', hashHex);

        try {
            const existing = await getAllImages();
            const dupByHash = existing.find(it => (it.hash && it.hash === hashHex));
            if (dupByHash) {
                throw new Error('Ảnh đã tồn tại (trùng nội dung). Vui lòng đổi ảnh khác.');
            }

            const targetName = (imageName || imageFile.name || '').trim().toLowerCase();
            if (targetName) {
                const dupByName = existing.find(it => (it.name || '').trim().toLowerCase() === targetName);
                if (dupByName) {
                    throw new Error('Tên ảnh đã tồn tại. Vui lòng đổi tên khác.');
                }
            }
        } catch (e) {
            // Nếu API lỗi, bỏ qua kiểm tra trùng và tiếp tục upload
            if (e && e.message && (e.message.includes('đã tồn tại') || e.message.includes('tồn tại'))) {
                throw e;
            }
            console.warn('Bỏ qua kiểm tra trùng do lỗi lấy danh sách ảnh:', e);
        }

        // 2) Upload file lên Cloudinary (unsigned)
        // LƯU Ý: Endpoint đúng cho ảnh là /image/upload
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const formData = new FormData();

        // Luôn chuyển sang base64 data URL để Cloudinary nhận đúng định dạng
        // (tránh trường hợp bị nhận nhầm như dds)
        const base64DataUrl = await fileToBase64(imageFile);
        console.log('Base64 startsWith:', base64DataUrl.substring(0, 30));
        formData.append('file', base64DataUrl);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudRes = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData
        });

        const cloudText = await cloudRes.text();
        let cloudData = {};
        try { cloudData = JSON.parse(cloudText); } catch (_) { /* ignore */ }
        if (!cloudRes.ok) {
            console.error('❌ Upload Cloudinary thất bại:', {
                status: cloudRes.status,
                statusText: cloudRes.statusText,
                body: cloudText,
                parsed: cloudData
            });
            const msg = cloudData?.error?.message || cloudRes.statusText || 'Không thể upload ảnh lên Cloudinary';
            throw new Error(msg);
        }

        const imageUrl = cloudData.secure_url || cloudData.url;
        if (!imageUrl) {
            throw new Error('Cloudinary không trả về URL ảnh');
        }
        console.log('✅ Upload Cloudinary thành công:', imageUrl);

        // 3) Lưu URL ảnh vào MockAPI (kèm hash để chống trùng lần sau)
        const imageData = {
            name: imageName || imageFile.name,
            img: imageUrl,
            hash: hashHex
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imageData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Không thể lưu ảnh vào MockAPI: ' + errorText);
        }

        const result = await response.json();
        console.log('✅ Lưu MockAPI thành công:', result);
        return result;
    } catch (error) {
        console.error('❌ Lỗi upload ảnh:', error);
        throw error;
    }
}
  

// Xóa ảnh
async function deleteImage(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Không thể xóa ảnh');
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}

// Tìm kiếm ảnh theo tên
async function searchImagesByName(searchTerm) {
    try {
        const allImages = await getAllImages();
        const filtered = allImages.filter(img => 
            img.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filtered;
    } catch (error) {
        console.error('Error searching images:', error);
        throw error;
    }
}

// Helper function: Resize và compress ảnh
function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Tính toán kích thước mới
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Không thể resize ảnh'));
                    }
                }, file.type, quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
    });
}

// Helper function: Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper: SHA-256 hash (hex) của file
async function sha256FileHex(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Helper function: Download image
function downloadImage(imageUrl, imageName) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

