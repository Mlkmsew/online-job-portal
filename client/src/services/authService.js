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
  const response = await api.get('/auth/me', { skipAuthRedirect: true });
  return response.data.data;
};

const updateProfile = async (data) => {
  const response = await api.put('/auth/update-profile', data);
  return response.data;
};

const uploadCV = async (formData) => {
  const response = await api.put('/auth/upload-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const uploadAvatar = async (formData) => {
  const response = await api.put('/auth/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default { register, login, logout, getMe, updateProfile, uploadCV, uploadAvatar };
