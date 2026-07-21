// ============================================
// Notification Controller
// ============================================
const Notification = require('../models/Notification');
const { asyncHandler, paginate } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const query = { recipient: req.user.id };
  if (req.query.isRead !== undefined) query.isRead = req.query.isRead === 'true';

  const { results, pagination } = await paginate(Notification, query, req.query, ['sender']);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
  if (!notification) return next(new AppError('Notification not found.', 404));

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({ success: true, message: 'Marked as read.' });
});

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
  if (!notification) return next(new AppError('Notification not found.', 404));
  await notification.deleteOne();
  res.status(200).json({ success: true, message: 'Notification deleted.' });
});

// @desc    Get unread count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.status(200).json({ success: true, count });
});

module.exports = exports;
