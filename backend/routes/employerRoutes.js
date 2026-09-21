const express = require('express');
const router = express.Router();
const { 
  getDashboard, 
  markJobAsPaid, 
  getPaymentCheckout, 
  verifyJobPostingPayment, 
  getPaymentStatus,
  initiateChapaPayment,
  initiateTelebirrPayment,
  initiateBankTransferPayment,
  chapaPaymentCallback,
  telebirrPaymentCallback,
} = require('../controllers/employerController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');

router.use(protect, requireEmailVerified);

// Employer dashboard
router.get('/dashboard', authorize('employer', 'admin'), getDashboard);

// Payment checkout flow (before job creation)
router.get('/payment/checkout', authorize('employer', 'admin'), getPaymentCheckout);
router.post('/payment/verify', authorize('employer', 'admin'), verifyJobPostingPayment);
router.get('/payment/status/:transactionReference', authorize('employer', 'admin'), getPaymentStatus);

// Payment initiation (redirects to provider checkout)
router.post('/payment/initiate/chapa', authorize('employer', 'admin'), initiateChapaPayment);
router.post('/payment/initiate/telebirr', authorize('employer', 'admin'), initiateTelebirrPayment);
router.post('/payment/initiate/bank_transfer', authorize('employer', 'admin'), initiateBankTransferPayment);

// Payment provider callbacks/webhooks (public - no auth required)
router.post('/payment/callback/chapa', chapaPaymentCallback);
router.post('/payment/callback/telebirr', telebirrPaymentCallback);

// Mark job as paid (after successful payment) - legacy endpoint for existing flow
router.post('/jobs/:id/pay', authorize('employer', 'admin'), markJobAsPaid);

module.exports = router;
