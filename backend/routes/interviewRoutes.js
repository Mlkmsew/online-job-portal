const express = require('express');
const router = express.Router();
const { getInterviews, getInterviewById, scheduleInterview, updateInterview } = require('../controllers/interviewController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');

router.use(protect, requireEmailVerified);
router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.post('/', authorize('employer', 'admin'), scheduleInterview);
router.put('/:id', authorize('employer', 'admin'), updateInterview);

module.exports = router;

