import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { imagesAPI } from '../services/api';
import '../styles/common.css';

// Helper function để convert relative URL thành full URL
const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  // Nếu đã là full URL (bắt đầu bằng http:// hoặc https://), return nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Nếu là relative URL (bắt đầu bằng /), thêm backend base URL
  // Mặc định dùng localhost:3000, có thể override bằng env variable
  let backendUrl = 'http://localhost:3000';
  
  // Thử lấy từ window.location nếu có
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    // Nếu frontend chạy trên port khác 3000, dùng localhost:3000 cho backend
    if (currentOrigin.includes('localhost') && !currentOrigin.includes(':3000')) {
      backendUrl = 'http://localhost:3000';
    } else {
      // Production hoặc cùng origin
      backendUrl = currentOrigin;
    }
  }
  
  // Đảm bảo URL không có double slash
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendUrl}${cleanUrl}`;
};

export default function Gallery() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await imagesAPI.getAll(page, limit);
      console.log('Gallery - Received response:', response);
      console.log('Gallery - Response type:', typeof response);
      console.log('Gallery - Is array:', Array.isArray(response));
      
      // Đảm bảo luôn có array, xử lý nhiều format response
      let imageList = [];
      
      if (Array.isArray(response)) {
        // Response là array trực tiếp
        imageList = response;
      } else if (response && typeof response === 'object') {
        // Response là object, thử nhiều cách parse
        // Format 1: { success: true, data: { images: [...] } }
        // Format 2: { success: true, data: [...] }
        // Format 3: { images: [...] }
        // Format 4: { data: [...] }
        // Format 5: { results: [...] }
        
        if (response.data) {
          // Có data field
          if (Array.isArray(response.data)) {
            imageList = response.data;
          } else if (response.data.images && Array.isArray(response.data.images)) {
            imageList = response.data.images;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            imageList = response.data.data;
          }
        } else if (response.images && Array.isArray(response.images)) {
          imageList = response.images;
        } else if (response.results && Array.isArray(response.results)) {
          imageList = response.results;
        }
        
        // Nếu vẫn không phải array, log để debug
        if (!Array.isArray(imageList)) {
          console.warn('Could not parse image list from response:', response);
          imageList = [];
        }
      }
      
      console.log('Gallery - Processed image list:', imageList);
      console.log('Gallery - Image list length:', imageList.length);
      
      // Đảm bảo luôn set một array
      setImages(Array.isArray(imageList) ? imageList : []);
      
      // Lưu thông tin pagination nếu có
      if (response && response.pagination) {
        setPagination(response.pagination);
      } else if (response && response.data && response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error loading images:', err);
      // Đảm bảo set images là array rỗng khi có lỗi
      setImages([]);
      // Hiển thị thông báo lỗi chi tiết hơn
      if (err.message.includes('404') || err.message.includes('not exist') || err.message.includes('HTML error page') || err.message.includes('route not configured')) {
        setError(`Lỗi: ${err.message}\n\nBackend có thể chưa có file routes/images.js hoặc route chưa được cấu hình đúng. Vui lòng kiểm tra:\n1. File routes/images.js có tồn tại không\n2. Route GET /api/images có được export đúng không\n3. Backend có đang chạy trên port 3000 không`);
      } else if (err.message.includes('Network') || err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend có đang chạy tại http://localhost:3000 không\n2. CORS đã được cấu hình đúng chưa');
      } else {
        setError(err.message || 'Không thể tải danh sách ảnh. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const filtered = useMemo(() => {
    // Đảm bảo images luôn là array
    const safeImages = Array.isArray(images) ? images : [];
    const q = query.trim().toLowerCase();
    if (!q) return safeImages;
    return safeImages.filter(img => {
      if (!img || typeof img !== 'object') return false;
      // Kiểm tra nhiều field name có thể có
      const name = img.originalname || img.originalName || img.filename || img.name || '';
      return name.toLowerCase().includes(q);
    });
  }, [images, query]);

  const downloadImage = async (imageUrl, filename, isBase64 = false) => {
    try {
      let blob;
      if (isBase64) {
        // Convert base64 to blob
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else {
        // Fetch from URL
        const response = await fetch(imageUrl);
        blob = await response.blob();
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="gallery-container">
      <h2 className="gallery-title">Thư viện ảnh</h2>
      <input
        className="search-box"
        placeholder="🔍 Tìm kiếm theo tên ảnh..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      
      {loading ? (
        <div className="loading">Đang tải ảnh</div>
      ) : error ? (
        <div className="alert alert-error" style={{ whiteSpace: 'pre-line' }}>
          {error}
          <div style={{ marginTop: '12px' }}>
            <button 
              onClick={loadImages}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : !Array.isArray(filtered) || filtered.length === 0 ? (
        <div className="empty-state">
          {query ? 'Không tìm thấy ảnh nào' : 'Chưa có ảnh nào được tải lên'}
        </div>
      ) : (
        <>
        <div className="gallery-grid">
          {Array.isArray(filtered) && filtered.length > 0 && filtered.map(img => {
            // Ưu tiên originalname, sau đó filename, sau đó name
            const imageName = img.originalname || img.originalName || img.filename || img.name || 'Ảnh';
            
            // Kiểm tra file extension để xác định có thể render ảnh không
            const fileExtension = imageName.toLowerCase().split('.').pop() || '';
            const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension);
            // Bỏ render DDS/không phải ảnh web
            if (!isImageFile) return null;
            
            // Kiểm tra base64 (cho MockAPI) hoặc URL (cho backend server)
            const base64 = img.base64 || img.base64Data || '';
            const rawUrl = img.url || img.path || img.imageUrl || '';
            
            // Nếu không có base64 và không có URL, bỏ qua
            if (!base64 && !rawUrl) {
              console.warn('Image missing URL/base64:', img);
              return null;
            }
            
            // Convert relative URL to full URL hoặc dùng base64
            let finalUrl;
            if (base64) {
              // Nếu có base64, dùng trực tiếp (đã là data:image/...;base64,...)
              finalUrl = base64;
            } else {
              const imageUrl = getImageUrl(rawUrl);
              // Thêm cache-busting để tránh cache 404/old file (chỉ khi dùng URL)
              const versionTag = encodeURIComponent(img.updatedAt || img.createdAt || Date.now());
              finalUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${versionTag}`;
            }
            
            // Debug log
            console.log('Rendering image:', { 
              originalname: imageName, 
              hasBase64: !!base64,
              rawUrl, 
              finalUrl: base64 ? 'base64 (hidden)' : finalUrl
            });
            
            // Xử lý uploadedBy - có thể là object hoặc string
            let uploadedBy = 'Unknown';
            if (img.uploadedBy) {
              if (typeof img.uploadedBy === 'object') {
                uploadedBy = img.uploadedBy.username || img.uploadedBy.email || uploadedBy;
              } else {
                uploadedBy = img.uploadedBy;
              }
            } else if (img.uploadedByUser) {
              uploadedBy = typeof img.uploadedByUser === 'object' 
                ? (img.uploadedByUser.username || img.uploadedByUser.email || uploadedBy)
                : img.uploadedByUser;
            } else if (img.user?.username) {
              uploadedBy = img.user.username;
            }
            
            return (
              <div key={img.id || img._id} className="image-card">
                <div className="image-card-header">
                  <div className="image-card-title">{imageName}</div>
                  <div className="image-card-meta">Bởi: {uploadedBy}</div>
                </div>
                <div className="image-card-body">
                  <img 
                    src={finalUrl} 
                    alt={imageName} 
                    className="image-card-img"
                    loading="lazy"
                    onError={(e) => {
                      console.error('❌ Image load error:', {
                        finalUrl,
                        rawUrl,
                        imageName,
                        img
                      });
                      e.target.style.display = 'none';
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) {
                        errorDiv.style.display = 'block';
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', finalUrl);
                    }}
                  />
                  <div style={{ display: 'none', padding: '20px', textAlign: 'center', color: '#999' }}>
                    Không thể tải ảnh: {imageName}
                  </div>
                </div>
                <div className="image-card-footer">
                  <button
                    onClick={() => downloadImage(finalUrl, imageName, !!base64)}
                    className="image-card-btn"
                  >
                    ⬇️ Tải xuống
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {pagination && (
          <div className="pagination">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || loading}
              className="pagination-btn"
            >
              ← Trước
            </button>
            <span className="pagination-info">
              Trang {page} / {pagination.pages || Math.ceil((pagination.total || 0) / limit)}
            </span>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={page >= (pagination.pages || Math.ceil((pagination.total || 0) / limit)) || loading}
              className="pagination-btn"
            >
              Sau →
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}


