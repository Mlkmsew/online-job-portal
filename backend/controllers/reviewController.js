// ============================================
// Review Controller - Company Reviews
// ============================================
const Review = require('../models/Review');
const Company = require('../models/Company');
const { asyncHandler, paginate } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get reviews for a company
// @route   GET /api/reviews/company/:companyId
// @access  Public
exports.getCompanyReviews = asyncHandler(async (req, res) => {
  const query = { company: req.params.companyId, isApproved: true };
  const { results, pagination } = await paginate(Review, query, req.query, ['reviewer']);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.body.company);
  if (!company) return next(new AppError('Company not found.', 404));

  const existing = await Review.findOne({ reviewer: req.user.id, company: req.body.company });
  if (existing) return next(new AppError('You have already reviewed this company.', 400));

  req.body.reviewer = req.user.id;
  const review = await Review.create(req.body);
  res.status(201).json({ success: true, message: 'Review submitted!', data: review });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));
  if (review.reviewer.toString() !== req.user.id) return next(new AppError('Not authorized.', 403));

  review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Review updated.', data: review });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));
  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }
  await review.deleteOne();
  res.status(200).json({ success: true, message: 'Review deleted.' });
});

module.exports = exports;
