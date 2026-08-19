// ============================================
// API Service - Axios Configuration
// ============================================
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const isFormData = config.data instanceof FormData;
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    } else {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('ethiojob_resumes');
  sessionStorage.clear();
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    if (error.response?.status === 401) {
      clearAuthStorage();
      if (!error.config?.skipAuthRedirect) {
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    } else if (!error.config?.skipGlobalErrorToast) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
