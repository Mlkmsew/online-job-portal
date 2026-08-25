// ============================================
// Resume Service - Job Seeker CV Builder API
// ============================================
import api from './api';

export const getResumes = () => api.get('/resumes');
export const getResume = (id) => api.get(`/resumes/${id}`);
export const createResume = (data) => api.post('/resumes', data);
export const updateResume = (id, data) => api.put(`/resumes/${id}`, data);
export const deleteResume = (id) => api.delete(`/resumes/${id}`);
export const syncResumeProfile = (id) => api.post(`/resumes/${id}/sync-profile`);
export const setDefaultResume = (id) => api.patch(`/resumes/${id}/default`);

export default { getResumes, getResume, createResume, updateResume, deleteResume, syncResumeProfile, setDefaultResume };
