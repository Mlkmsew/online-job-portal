const express = require('express');
const router = express.Router();
const { getInterviews, getInterviewById, getInterviewCandidates, getShortlistedCandidates, scheduleInterview, updateInterview, deleteInterview } = require('../controllers/interviewController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');

router.use(protect, requireEmailVerified);
router.get('/shortlisted-candidates', authorize('employer', 'admin'), getShortlistedCandidates);
router.get('/candidates', authorize('employer', 'admin'), getInterviewCandidates);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.post('/', authorize('employer', 'admin'), scheduleInterview);
router.put('/:id', authorize('employer', 'admin'), updateInterview);
router.delete('/:id', authorize('employer', 'admin'), deleteInterview);

module.exports = router;

