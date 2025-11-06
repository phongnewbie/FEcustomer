const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
// Optional: MockAPI endpoint (absolute), e.g. https://xxxx.mockapi.io/api/v1/images
const MOCKAPI_URL = 'https://6309f78a32499100327e5878.mockapi.io/QLND';
// Optional: Cloudinary unsigned upload config
const CLOUDINARY_CLOUD_NAME = 'dy696quxi';
const CLOUDINARY_UNSIGNED_PRESET = 'customer';

export const IS_USING_MOCKAPI = !!MOCKAPI_URL;
// Base URL cho static files: ưu tiên env, fallback suy ra từ API_BASE_URL
const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_BASE_URL || API_BASE_URL.replace(/\/api\/?$/, '');

const TOKEN_KEY = 'app_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token && !options.noAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Clone response để có thể đọc nhiều lần nếu cần
    const responseClone = response.clone();
    
    // Kiểm tra Content-Type trước khi parse JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    // Log để debug
    console.log(`[API] ${endpoint} - Status: ${response.status}, Content-Type: ${contentType}`);
    
    let data;
    if (isJson) {
      try {
        data = await response.json();
        console.log(`[API] ${endpoint} - Response:`, data);
      } catch (parseError) {
        // Nếu parse JSON thất bại, có thể response là HTML error page
        // Đọc từ clone để xem nội dung
        try {
          const text = await responseClone.text();
          console.error(`[API] ${endpoint} - Failed to parse JSON. Response text:`, text.substring(0, 200));
          // Nếu bắt đầu bằng <!DOCTYPE hoặc <html, đây là HTML error page
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error(`Server returned HTML error page (${response.status}): Endpoint may not exist or route not configured.`);
          }
          throw new Error(`Failed to parse JSON response: ${parseError.message}`);
        } catch (textError) {
          throw new Error(`Server returned non-JSON response (${response.status}): Endpoint may not exist.`);
        }
      }
    } else {
      // Nếu không phải JSON, lấy text để kiểm tra
      const text = await response.text();
      console.log(`[API] ${endpoint} - Non-JSON response:`, text.substring(0, 200));
      if (response.ok) {
        // Nếu response OK nhưng không phải JSON, trả về text
        return text;
      } else {
        // Nếu là error page HTML (thường là 404), thông báo rõ ràng hơn
        throw new Error(`Server error ${response.status} ${response.statusText}. Endpoint may not exist or server returned HTML instead of JSON.`);
      }
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Request failed: ${response.status} ${response.statusText}`;
      console.error(`[API] ${endpoint} - Error:`, errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Nếu đã là Error object, throw lại
    if (error instanceof Error) {
      console.error(`[API] ${endpoint} - Exception:`, error.message);
      throw error;
    }
    // Nếu không phải Error object, wrap thành Error
    throw new Error(error.message || 'Network error or server unavailable');
  }
}

export const authAPI = {
  register: async (username, email, password) => {
    return apiCall('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
      noAuth: true,
    });
  },

  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      noAuth: true,
    });
  },

  // Verify token và lấy thông tin user hiện tại
  getCurrentUser: async () => {
    return apiCall('/auth/me', {
      method: 'GET',
    });
  },
};

// Helper: Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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

export const uploadAPI = {
  uploadImage: async (file, userInfo = null) => {
    // Option 1: Upload với FormData (cho backend server)
    // Uncomment đoạn này nếu dùng backend server với file upload
    // const formData = new FormData();
    // formData.append('image', file);
    // return apiCall('/images', {
    //   method: 'POST',
    //   body: formData,
    // });

    // Option 2: Convert to base64 cho MockAPI (không cần server)
    const base64 = await fileToBase64(file);
    const imageData = {
      filename: file.name,
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
      base64: base64, // Lưu base64 thay vì url
      uploadedBy: userInfo ? {
        _id: userInfo.id || userInfo._id,
        username: userInfo.username,
        email: userInfo.email
      } : 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return apiCall('/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    });
  },
  // Upload qua Cloudinary (unsigned) rồi lưu URL vào MockAPI
  uploadViaCloudinaryAndMockAPI: async (file, userInfo = null, imageNameOverride) => {
    if (!MOCKAPI_URL) {
      throw new Error('Thiếu REACT_APP_MOCKAPI_URL để lưu metadata ảnh.');
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UNSIGNED_PRESET) {
      throw new Error('Thiếu cấu hình Cloudinary (REACT_APP_CLOUDINARY_CLOUD_NAME, REACT_APP_CLOUDINARY_UNSIGNED_PRESET).');
    }

    // Tính hash để chống trùng (tùy chọn)
    const hashHex = await sha256FileHex(file);

    // Upload lên Cloudinary (unsigned)
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const base64DataUrl = await fileToBase64(file);
    const formData = new FormData();
    formData.append('file', base64DataUrl);
    formData.append('upload_preset', CLOUDINARY_UNSIGNED_PRESET);

    const cloudRes = await fetch(cloudinaryUrl, { method: 'POST', body: formData });
    const cloudText = await cloudRes.text();
    let cloudData = {};
    try { cloudData = JSON.parse(cloudText); } catch (_) {}
    if (!cloudRes.ok) {
      const msg = cloudData?.error?.message || cloudRes.statusText || 'Không thể upload ảnh lên Cloudinary';
      throw new Error(msg);
    }
    const secureUrl = cloudData.secure_url || cloudData.url;
    if (!secureUrl) {
      throw new Error('Cloudinary không trả về URL ảnh');
    }

    // Lưu URL vào MockAPI
    const imageName = imageNameOverride || file.name;
    const payload = {
      name: imageName,
      img: secureUrl,
      hash: hashHex,
      uploadedBy: userInfo ? {
        _id: userInfo.id || userInfo._id,
        username: userInfo.username,
        email: userInfo.email,
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockRes = await fetch(MOCKAPI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!mockRes.ok) {
      const text = await mockRes.text();
      throw new Error(`Không thể lưu ảnh vào MockAPI: ${text}`);
    }
    return await mockRes.json();
  },
};

// Helper function để tạo full URL từ relative path hoặc base64
export function getImageUrl(url, base64) {
  // Nếu có base64, ưu tiên dùng base64
  if (base64) {
    return base64; // Đã là data:image/...;base64,...
  }
  
  if (!url) return '';
  // Nếu đã là full URL (http/https), trả về nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Nếu là base64 string (bắt đầu với data:)
  if (url.startsWith('data:')) {
    return url;
  }
  // Nếu là relative path, thêm backend base URL
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  // Nếu không bắt đầu bằng /, thêm /
  return `${BACKEND_BASE_URL}/${url}`;
}

export const imagesAPI = {
  getAll: async (page = 1, limit = 20) => {
    // Nếu dùng MockAPI, ưu tiên lấy trực tiếp từ đó
    if (MOCKAPI_URL) {
      const res = await fetch(MOCKAPI_URL, { method: 'GET' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`MockAPI error: ${text}`);
      }
      const list = await res.json();
      if (!Array.isArray(list)) return { images: [], pagination: null };
      // Chuẩn hóa về format chung: { originalname, url, createdAt, ... }
      const images = list.map(it => ({
        _id: it.id,
        originalname: it.name,
        filename: it.name,
        url: it.img, // Cloudinary URL
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        uploadedBy: it.uploadedBy,
      }));
      return { images, pagination: { page: 1, limit: images.length, total: images.length, totalPages: 1 } };
    }

    // Ngược lại, fallback về backend API truyền thống
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiCall(`/images?${queryParams.toString()}`, {
      method: 'GET',
    });
  },
};

