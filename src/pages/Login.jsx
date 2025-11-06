import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/common.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Đăng nhập</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={onSubmit}>
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
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="form-footer">
        Chưa có tài khoản? <Link to="/register" className="link">Đăng ký ngay</Link>
      </p>
    </div>
  );
}


