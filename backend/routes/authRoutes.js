// ============================================
// Auth Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, verifyEmail, resendVerification,
  forgotPassword, resetPasswordWithOTP, updatePassword, refreshToken,
  updateProfile, uploadAvatar, uploadCV, uploadCertificate,
  verifyOTP, requestEmailChange, confirmEmailChange, googleLogin, githubLogin,
  sendOTP,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar: avatarUpload, uploadCV: cvUpload, uploadCert } = require('../config/cloudinary');
const { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, validate } = require('../middleware/validate');
const { authLimiter, passwordResetLimiter, uploadLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-otp', verifyOTP);
router.post('/send-otp', sendOTP);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidator, validate, resetPasswordWithOTP);
router.post('/refresh-token', refreshToken);

// Social
router.post('/google', googleLogin);
router.post('/github', githubLogin);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);
router.post('/resend-verification', resendVerification);
router.post('/request-email-change', requestEmailChange);
router.post('/confirm-email-change', confirmEmailChange);
router.put('/update-password', updatePassword);
router.put('/update-profile', updateProfile);
router.put('/upload-avatar', uploadLimiter, avatarUpload.single('avatar'), uploadAvatar);
router.put('/upload-cv', uploadLimiter, cvUpload.single('cv'), uploadCV);
router.post('/upload-certificate', uploadLimiter, uploadCert.single('certificate'), uploadCertificate);

module.exports = router;
