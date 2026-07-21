// ============================================
// Review Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getCompanyReviews, createReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect, requireEmailVerified } = require('../middleware/auth');

router.get('/company/:companyId', getCompanyReviews);

router.use(protect, requireEmailVerified);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
