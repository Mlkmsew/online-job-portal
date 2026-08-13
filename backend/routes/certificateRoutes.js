// ============================================
// Certificate Verification Routes (Job Seeker)
// ============================================
const express = require('express');
const router = express.Router();
const {
  uploadAndVerify,
  getMyVerifications,
  getMyVerification,
  checkByNumber,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');
const { uploadCert } = require('../config/cloudinary');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(protect);

// Job seekers upload + verify a certificate
router.post('/verify', authorize('jobseeker'), uploadLimiter, uploadCert.single('certificate'), uploadAndVerify);

// Job seekers view their own verification history
router.get('/my', authorize('jobseeker'), getMyVerifications);
router.get('/my/:id', authorize('jobseeker'), getMyVerification);

// Any authenticated user can check the status of a verification number
// (returns only the status — never the trusted database contents)
router.post('/check', checkByNumber);

module.exports = router;