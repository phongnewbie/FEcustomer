import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, getToken, setToken } from '../services/api';

const AuthContext = createContext(null);

const LOCAL_STORAGE_USER_KEY = 'app_current_user';

function readCurrentUser() {
  const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCurrentUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = readCurrentUser();
    const token = getToken();
    // Kiểm tra nếu có token và user, trả về user để tránh flash của login screen
    // Sau đó sẽ verify với backend trong useEffect
    if (storedUser && token) {
      return storedUser;
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Verify token với backend khi app khởi động
  useEffect(() => {
    const verifyToken = async () => {
      const token = getToken();
      const storedUser = readCurrentUser();
      
      // Nếu không có token hoặc user, không cần verify
      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      // Nếu không cấu hình API_BASE_URL (ví dụ chạy MockAPI-only), bỏ qua verify để không ghi đè role
      if (!process.env.REACT_APP_API_BASE_URL) {
        setUser(storedUser);
        setLoading(false);
        return;
      }

      try {
        // Gọi API để verify token và lấy thông tin user mới nhất
        const response = await authAPI.getCurrentUser();
        
        // Backend có thể trả về: { success, message, data: { user: {...} } }
        // Hoặc có thể là: { user: {...} }
        const userObj = response.data?.user || response.user || response;
        
        // Kiểm tra nhiều cách backend có thể trả về role
        // Ưu tiên response.data.user.role (format của backend hiện tại)
        // Chỉ cập nhật role khi backend trả về hợp lệ; nếu không, giữ nguyên role hiện có
        const roleFromServer = response.data?.user?.role || userObj?.role || response.data?.role || response.role || userObj?.userRole;
        const role = roleFromServer || storedUser.role;
        
        const userData = {
          id: userObj?.id || userObj?._id || response.id || response._id || storedUser.id,
          username: userObj?.username || response.username || storedUser.username,
          email: userObj?.email || response.email || storedUser.email,
          role: role,
        };
        
        
        // Cập nhật user info từ backend
        setUser(userData);
        writeCurrentUser(userData);
      } catch (error) {
        // Nếu endpoint không tồn tại (404), vẫn giữ session với user đã lưu
        // Chỉ logout nếu token thực sự không hợp lệ (401, 403)
        if (error.message.includes('404') || error.message.includes('not found')) {
          // Backend chưa có endpoint /auth/me, giữ lại session với user đã lưu
          console.warn('Backend endpoint /auth/me not found, using stored user data');
          setUser(storedUser);
        } else if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
          // Token không hợp lệ hoặc đã hết hạn, clear và logout
          console.error('Token verification failed:', error);
          setUser(null);
          writeCurrentUser(null);
          setToken(null);
        } else {
          // Lỗi khác (CORS, network...), giữ nguyên user/role hiện có để không bị tụt về 'user'
          console.warn('Token verification error, keeping stored user:', error);
          setUser(storedUser);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register(username, email, password);
      console.log('Register response:', response); // Debug log
      
      // Backend có thể trả về: { success, message, data: { user: {...}, token: "..." } }
      // Hoặc có thể là: { user: {...}, token: "..." }
      const userObj = response.data?.user || response.user || response;
      const token = response.data?.token || response.token;
      
      // Kiểm tra nhiều cách backend có thể trả về role
      // Ưu tiên response.data.user.role (format của backend hiện tại)
      const role = response.data?.user?.role || 
                   userObj?.role || 
                   response.data?.role ||
                   response.role || 
                   userObj?.userRole ||
                   'user';
      
      const userData = {
        id: userObj?.id || userObj?._id || response.id || response._id,
        username: userObj?.username || response.username || username,
        email: userObj?.email || response.email || email,
        role: role,
      };
      
      console.log('User data after register:', userData); // Debug log
      
      // Lưu token nếu backend trả về
      if (token) {
        setToken(token);
      }
      
      setUser(userData);
      writeCurrentUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response); // Debug log
      
      // Backend trả về: { success, message, data: { user: {...}, token: "..." } }
      // Hoặc có thể là: { user: {...}, token: "..." }
      const userObj = response.data?.user || response.user || response;
      const token = response.data?.token || response.token;
      
      // Kiểm tra nhiều cách backend có thể trả về role
      // Ưu tiên response.data.user.role (format của backend hiện tại)
      const role = response.data?.user?.role || 
                   userObj?.role || 
                   response.data?.role ||
                   response.role || 
                   userObj?.userRole ||
                   'user';
      
      const userData = {
        id: userObj?.id || userObj?._id || response.id || response._id,
        username: userObj?.username || response.username,
        email: userObj?.email || response.email || email,
        role: role,
      };
      
      console.log('User data after login:', userData); // Debug log
      
      // Lưu token
      if (token) {
        setToken(token);
      }
      
      setUser(userData);
      writeCurrentUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    writeCurrentUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({ user, login, logout, register, loading }), [user, loading]);

  // Hiển thị loading khi đang verify token
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px' }}>Đang tải...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return null;
  if (role && user.role !== role) return null;
  return children;
}


