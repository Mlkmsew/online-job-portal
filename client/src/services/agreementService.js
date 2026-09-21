import api from './api';

// Admin Agreement Management
export const agreementService = {
  // Get all agreements (admin)
  getAll: (params = {}) => api.get('/agreements', { params }),

  // Get single agreement by ID (admin)
  getById: (id) => api.get(`/agreements/${id}`),

  // Create new agreement (admin)
  create: (data) => api.post('/agreements', data),

  // Update agreement (admin)
  update: (id, data) => api.put(`/agreements/${id}`, data),

  // Delete agreement (admin)
  delete: (id) => api.delete(`/agreements/${id}`),

  // Update agreement status (admin)
  updateStatus: (id, status) => api.patch(`/agreements/${id}/status`, { status }),

  // Public / Employer endpoints

  // Get active agreements (Terms & Privacy)
  getActive: () => api.get('/agreements/active'),

  // Get active agreement by type
  getActiveByType: (type) => api.get(`/agreements/active/${type}`),

  // Accept agreement (Employer)
  accept: (agreementId, type) => api.post('/agreements/accept', { agreementId, type }),

  // Get user's accepted agreements
  getAccepted: () => api.get('/agreements/accepted'),
};

export default agreementService;