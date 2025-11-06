# Ứng dụng Quản lý Ảnh với MockAPI

Ứng dụng web cho phép admin upload/xóa ảnh và user xem/tìm kiếm/tải ảnh về.

## Cấu trúc dự án

- `index.html` - Trang chủ cho user (xem, tìm kiếm, tải ảnh)
- `admin.html` - Trang quản trị cho admin (upload, xóa ảnh)
- `api.js` - Xử lý các API calls với MockAPI
- `app.js` - Logic cho trang user
- `admin.js` - Logic cho trang admin
- `styles.css` - Styling cho cả 2 trang

## Cách sử dụng

### 1. Tạo MockAPI endpoint

1. Truy cập https://mockapi.io và đăng ký/đăng nhập
2. Tạo một project mới
3. Tạo một resource mới với tên `images` (hoặc tên khác tùy bạn)
4. Thêm các trường:
   - `name` (String) - Tên ảnh
   - `url` (String) - URL ảnh (hoặc base64)
   - `createdAt` (String) - Ngày tạo

### 2. Cấu hình API URL

Mở file `api.js` và thay thế `YOUR_MOCKAPI_ID` bằng ID thực tế từ MockAPI của bạn:

```javascript
const API_URL = 'https://YOUR_MOCKAPI_ID.mockapi.io/images';
```

Ví dụ:
```javascript
const API_URL = 'https://65abc123def456.mockapi.io/images';
```

### 3. Chạy ứng dụng

Mở file `index.html` hoặc `admin.html` trong trình duyệt web. Bạn có thể sử dụng một local server như:
- Live Server extension trong VS Code
- Python: `python -m http.server 8000`
- Node.js: `npx http-server`

## Tính năng

### Trang User (index.html)
- ✅ Xem tất cả ảnh trong gallery
- ✅ Tìm kiếm ảnh theo tên
- ✅ Tải ảnh về máy

### Trang Admin (admin.html)
- ✅ Upload ảnh (hỗ trợ drag & drop)
- ✅ Xem danh sách ảnh
- ✅ Xóa ảnh

## Lưu ý

- MockAPI có giới hạn về số lượng requests miễn phí
- Ảnh được lưu dưới dạng base64 trong MockAPI (do MockAPI không hỗ trợ upload file trực tiếp)
- Để sử dụng trong production, bạn nên sử dụng một dịch vụ lưu trữ ảnh thực tế như AWS S3, Cloudinary, etc.

