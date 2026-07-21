// ============================================
// Application Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  applyJob,
  getMyApplications,
  getEmployerApplications,
  getApplication,
  updateApplicationStatus,
  scheduleInterviewForApplication,
  withdrawApplication,
  bookmarkApplicant,
  downloadResume,
  exportEmployerApplications,
  shortlistApplicant,
  hireApplicant,
  rejectApplicant,
} = require('../controllers/applicationController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');
const { uploadCV } = require('../config/cloudinary');

router.use(protect, requireEmailVerified);

// Job seeker routes
router.post('/', authorize('jobseeker'), uploadCV.single('resume'), applyJob);
router.get('/my', authorize('jobseeker'), getMyApplications);
router.put('/:id/withdraw', authorize('jobseeker'), withdrawApplication);

// Employer routes
router.get('/employer', authorize('employer', 'admin'), getEmployerApplications);
router.put('/:id/status', authorize('employer', 'admin'), updateApplicationStatus);
router.post('/:id/schedule-interview', authorize('employer', 'admin'), scheduleInterviewForApplication);
router.put('/:id/bookmark', authorize('employer', 'admin'), bookmarkApplicant);
router.get('/:id/resume', authorize('employer','jobseeker','admin'), downloadResume);
router.get('/employer/export', authorize('employer','admin'), exportEmployerApplications);
router.put('/:id/shortlist', authorize('employer','admin'), shortlistApplicant);
router.put('/:id/hire', authorize('employer','admin'), hireApplicant);
router.put('/:id/reject', authorize('employer','admin'), rejectApplicant);

// Shared
router.get('/:id', getApplication);

module.exports = router;
