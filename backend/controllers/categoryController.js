// ============================================
// Category Controller (Public)
// ============================================
const Category = require('../models/Category');
const Job = require('../models/job');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all categories with active job counts
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.aggregate([
    { $match: { isActive: true } },
    { $sort: { order: 1, name: 1 } },
    {
      $lookup: {
        from: 'jobs',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$category', '$$categoryId'] },
                  { $in: ['$status', ['published', 'active']] },
                  { $eq: ['$isApproved', true] },
                ],
              },
            },
          },
          { $count: 'count' },
        ],
        as: 'jobStats',
      },
    },
    {
      $addFields: {
        jobCount: { $ifNull: [{ $arrayElemAt: ['$jobStats.count', 0] }, 0] },
      },
    },
    {
      $project: {
        jobStats: 0,
      },
    },
  ]);

  res.status(200).json({ success: true, count: categories.length, data: categories });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
  });
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ success: true, data: category });
});

module.exports = exports;
