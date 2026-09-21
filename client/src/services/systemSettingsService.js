import api from './api';

export const systemSettingsService = {
  // Public/Employer endpoints
  getJobPostingFeeSettings: () => api.get('/jobs/settings/job-posting-fee'),

  // Admin endpoints
  updateJobPostingFeeSettings: (data) => api.patch('/admin/settings/job-posting-fee', data),
  getPlatformSettings: () => api.get('/admin/settings/platform'),
  updatePlatformSettings: (data) => api.patch('/admin/settings/platform', data),

  // Employer payment checkout endpoints
  getPaymentCheckout: () => api.get('/employer/payment/checkout'),
  verifyJobPostingPayment: (data) => api.post('/employer/payment/verify', data),
  getPaymentStatus: (transactionReference) => api.get(`/employer/payment/status/${transactionReference}`),
  initiateChapaPayment: (returnUrl) => api.post('/employer/payment/initiate/chapa', { returnUrl }),
  initiateTelebirrPayment: (returnUrl) => api.post('/employer/payment/initiate/telebirr', { returnUrl }),
  initiateBankTransfer: (returnUrl) => api.post('/employer/payment/initiate/bank_transfer', { returnUrl }),

  // Employer endpoints (legacy)
  markJobAsPaid: (jobId, paymentData) => api.post(`/employer/jobs/${jobId}/pay`, paymentData),
};

export default systemSettingsService;