import api from './api';

const BASE = '/saved-searches';
const ALERT_BASE = '/job-alerts';

export const getSavedSearches = () => api.get(BASE);
export const createSavedSearch = (payload) => api.post(BASE, payload);
export const updateSavedSearch = (id, payload) => api.put(`${BASE}/${id}`, payload);
export const deleteSavedSearch = (id) => api.delete(`${BASE}/${id}`);
export const toggleSavedSearchNotification = (id) => api.patch(`${BASE}/${id}/toggle-notification`);

export const getJobAlerts = () => api.get(ALERT_BASE);
export const createJobAlert = (payload) => api.post(ALERT_BASE, payload);
export const updateJobAlert = (id, payload) => api.put(`${ALERT_BASE}/${id}`, payload);
export const deleteJobAlert = (id) => api.delete(`${ALERT_BASE}/${id}`);

// Automatic job-alert notifications (new_job type from /api/notifications)
export const getJobAlertNotifications = (params = {}) =>
  api.get('/notifications', { params: { type: 'new_job', limit: 50, ...params } });
export const markJobAlertRead = (id) => api.put(`/notifications/${id}/read`);

