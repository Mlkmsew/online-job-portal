const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/employerController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');

router.use(protect, requireEmailVerified);

// Employer dashboard
router.get('/dashboard', authorize('employer', 'admin'), getDashboard);

module.exports = router;
