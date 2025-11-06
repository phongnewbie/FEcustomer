import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { uploadAPI, IS_USING_MOCKAPI } from '../services/api';
import '../styles/common.css';

export default function AdminUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateFile = (file) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.dds'];
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) {
      return `Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedExtensions.join(', ')}`;
    }
    
    // Giới hạn kích thước file 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File quá lớn. Kích thước tối đa là 10MB';
    }
    
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!file) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (IS_USING_MOCKAPI) {
        await uploadAPI.uploadViaCloudinaryAndMockAPI(file, user);
      } else {
        await uploadAPI.uploadImage(file, user);
      }
      setMessage('Tải ảnh lên thành công!');
      setFile(null);
      // Reset file input
      e.target.reset();
    } catch (err) {
      setError(err.message || 'Tải ảnh lên thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Tải ảnh lên</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Chọn file ảnh (hỗ trợ: JPG, PNG, GIF, WEBP, BMP, DDS)</label>
          <input 
            type="file" 
            accept="image/*,.dds" 
            className="file-upload-input"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
          />
          {file && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              Đã chọn: {file.name}
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !file}
        >
          {loading ? 'Đang tải lên...' : 'Đăng ảnh'}
        </button>
      </form>
    </div>
  );
}


