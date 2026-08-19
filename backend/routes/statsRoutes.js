// ============================================
// Stats Routes (Public)
// ============================================
const express = require('express');
const router = express.Router();
const { getCommunityStats } = require('../controllers/statsController');

router.get('/community', getCommunityStats);

module.exports = router;