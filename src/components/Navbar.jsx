import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/common.css';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Thư viện ảnh</Link>
      {user?.role === 'admin' ? (
        <Link to="/admin" className="navbar-link">Đăng ảnh</Link>
      ) : null}
      <div className="navbar-user">
        {user ? (
          <>
            <span className="navbar-user-info">
              Xin chào, {user.username || user.email} 
              <strong style={{ 
                color: user.role === 'admin' ? '#667eea' : '#666',
                marginLeft: '4px'
              }}>
                ({user.role || 'user'})
              </strong>
            </span>
            <button onClick={logout} className="navbar-btn">Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Đăng nhập</Link>
            <Link to="/register" className="navbar-link">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}


