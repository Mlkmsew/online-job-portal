// ============================================
// Job Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  getJobs, getJob, createJob, updateJob, deleteJob, getMyJobs, closeJob, getSimilarJobs, getJobStats, getRecommendations,
} = require('../controllers/jobController');
const { getJobPostingFeeSettings } = require('../controllers/adminController');
const { protect, optionalAuth, authorize, requireEmailVerified } = require('../middleware/auth');
const { jobValidator, validate } = require('../middleware/validate');

router.get('/recommendations', protect, getRecommendations);
router.get('/stats/overview', getJobStats);
router.get('/my/posted', protect, authorize('employer', 'admin'), getMyJobs);
router.get('/:id/similar', getSimilarJobs);
router.get('/', optionalAuth, getJobs);
router.get('/:id', optionalAuth, getJob);

// Public endpoint for job posting fee settings (accessible to employers)
router.get('/settings/job-posting-fee', getJobPostingFeeSettings);

router.use(protect, authorize('employer', 'admin'), requireEmailVerified);
router.post('/', jobValidator, validate, createJob);
router.put('/:id', jobValidator, validate, updateJob);
router.delete('/:id', deleteJob);
router.put('/:id/close', closeJob);

module.exports = router;
