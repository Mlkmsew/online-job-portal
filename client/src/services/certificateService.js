// ============================================
// Certificate Verification API Service
// ============================================
import api from './api';

const uploadAndVerify = async (formData, onProgress) => {
  const response = await api.post('/certificates/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return response.data;
};

const getMyVerifications = async (params) => {
  const response = await api.get('/certificates/my', { params });
  return response.data;
};

const getMyVerification = async (id) => {
  const response = await api.get(`/certificates/my/${id}`);
  return response.data;
};

const checkByNumber = async (verificationNumber) => {
  const response = await api.post('/certificates/check', { verificationNumber });
  return response.data;
};

// ── Admin ────────────────────────────────────────────────────
const adminGetVerifications = async (params) => {
  const response = await api.get('/admin/certificates', { params });
  return response.data;
};

const adminGetVerification = async (id) => {
  const response = await api.get(`/admin/certificates/${id}`);
  return response.data;
};

const adminReview = async (id, payload) => {
  const response = await api.put(`/admin/certificates/${id}/review`, payload);
  return response.data;
};

const adminSuspendUser = async (id) => {
  const response = await api.put(`/admin/certificates/${id}/suspend-user`);
  return response.data;
};

export default {
  uploadAndVerify,
  getMyVerifications,
  getMyVerification,
  checkByNumber,
  adminGetVerifications,
  adminGetVerification,
  adminReview,
  adminSuspendUser,
};