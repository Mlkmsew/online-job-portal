import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const register = async (data) => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

const login = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data.data;
};

const updateProfile = async (data) => {
  const response = await axiosInstance.put('/auth/update-profile', data);
  return response.data;
};

const uploadCV = async (formData) => {
  const response = await axiosInstance.put('/auth/upload-cv', formData);
  return response.data;
};

export default { register, login, logout, getMe, updateProfile, uploadCV };
