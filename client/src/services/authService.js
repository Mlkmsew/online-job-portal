import api from './api';

const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

const updateProfile = async (data) => {
  const response = await api.put('/auth/update-profile', data);
  return response.data;
};

const uploadCV = async (formData) => {
  // Do not use the default JSON Content-Type for file uploads.
  // Let the browser set the multipart boundary by omitting Content-Type,
  // or explicitly set multipart/form-data when using axios.
  const response = await axiosInstance.put('/auth/upload-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default { register, login, logout, getMe, updateProfile, uploadCV };
