import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { uploadAPI, IS_USING_MOCKAPI } from '../services/api';
import '../styles/common.css';

export default function AdminUpload() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
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

  const validateFiles = (fileList) => {
    const fileArray = Array.from(fileList);
    const errors = [];
    
    fileArray.forEach((file, index) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      }
    });
    
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!files || files.length === 0) {
      setError('Vui lòng chọn ít nhất một file ảnh');
      return;
    }

    // Validate tất cả files
    const validationErrors = validateFiles(files);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      if (IS_USING_MOCKAPI) {
        // Nếu dùng MockAPI, upload từng file một
        const uploadPromises = Array.from(files).map(file => 
          uploadAPI.uploadViaCloudinaryAndMockAPI(file, user)
        );
        await Promise.all(uploadPromises);
        setMessage(`Đã tải lên thành công ${files.length} ảnh!`);
      } else {
        // Dùng backend server với upload multiple
        await uploadAPI.uploadMultipleImages(files, user);
        setMessage(`Đã tải lên thành công ${files.length} ảnh!`);
      }
      setFiles([]);
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
      {error && <div className="alert alert-error">{error.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Chọn file ảnh (hỗ trợ: JPG, PNG, GIF, WEBP, BMP, DDS) - Có thể chọn nhiều file</label>
          <input 
            type="file" 
            accept="image/*,.dds" 
            className="file-upload-input"
            multiple
            onChange={e => {
              const selectedFiles = e.target.files;
              if (selectedFiles && selectedFiles.length > 0) {
                setFiles(Array.from(selectedFiles));
              } else {
                setFiles([]);
              }
            }}
            required
          />
          {files.length > 0 && (
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                Đã chọn {files.length} file:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {Array.from(files).map((file, index) => (
                  <li key={index} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || files.length === 0}
        >
          {loading ? `Đang tải lên ${files.length} ảnh...` : `Đăng ${files.length > 0 ? files.length : ''} ảnh`}
        </button>
      </form>
    </div>
  );
}


