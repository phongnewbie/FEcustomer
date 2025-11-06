import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/common.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Đăng ký</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Tên đăng nhập</label>
          <input 
            className="form-input"
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Nhập tên đăng nhập"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email"
            className="form-input"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Nhập email của bạn"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mật khẩu</label>
          <input 
            type="password" 
            className="form-input"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Nhập mật khẩu"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
      <p className="form-footer">
        Đã có tài khoản? <Link to="/login" className="link">Đăng nhập</Link>
      </p>
    </div>
  );
}


