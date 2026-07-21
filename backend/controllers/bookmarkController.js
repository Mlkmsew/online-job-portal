// ============================================
// Bookmark Controller
// ============================================
const Bookmark = require('../models/Bookmark');
const Job = require('../models/Job');
const { asyncHandler, paginate } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get my bookmarks
// @route   GET /api/bookmarks
// @access  Private
exports.getBookmarks = asyncHandler(async (req, res) => {
  const { results, pagination } = await paginate(Bookmark, { user: req.user.id }, req.query, [
    { path: 'job', populate: { path: 'company', select: 'name logo' } },
  ]);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Add bookmark
// @route   POST /api/bookmarks
// @access  Private
exports.addBookmark = asyncHandler(async (req, res, next) => {
  const { job, note } = req.body;
  const jobDoc = await Job.findById(job);
  if (!jobDoc) return next(new AppError('Job not found.', 404));

  const existing = await Bookmark.findOne({ user: req.user.id, job });
  if (existing) return next(new AppError('Job already bookmarked.', 400));

  const bookmark = await Bookmark.create({ user: req.user.id, job, note });
  jobDoc.bookmarksCount += 1;
  await jobDoc.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, message: 'Job bookmarked.', data: bookmark });
});

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/:id
// @access  Private
exports.removeBookmark = asyncHandler(async (req, res, next) => {
  const bookmark = await Bookmark.findOne({ _id: req.params.id, user: req.user.id });
  if (!bookmark) return next(new AppError('Bookmark not found.', 404));

  const job = await Job.findById(bookmark.job);
  if (job && job.bookmarksCount > 0) {
    job.bookmarksCount -= 1;
    await job.save({ validateBeforeSave: false });
  }

  await bookmark.deleteOne();
  res.status(200).json({ success: true, message: 'Bookmark removed.' });
});

module.exports = exports;
