// ============================================
// Resume Routes - Job Seeker CV Builder
// ============================================
const express = require('express');
const router = express.Router();
const {
  getResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  syncProfile,
} = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/auth');

// Every resume route requires an authenticated job seeker.
router.use(protect, authorize('jobseeker'));

router.route('/').get(getResumes).post(createResume);
router.route('/:id').get(getResume).put(updateResume).delete(deleteResume);
router.post('/:id/sync-profile', syncProfile);

module.exports = router;
