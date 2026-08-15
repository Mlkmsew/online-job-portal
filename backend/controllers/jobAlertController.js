const JobAlert = require('../models/JobAlert');
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

exports.getJobAlerts = asyncHandler(async (req, res) => {
  const alerts = await JobAlert.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: alerts.length, data: alerts });
});

exports.createJobAlert = asyncHandler(async (req, res, next) => {
  const { title, region, city, jobType, keywords, frequency, active } = req.body;
  if (!title) return next(new AppError('Alert title is required.', 400));

  const existing = await JobAlert.findOne({ user: req.user.id, title });
  if (existing) return next(new AppError('An alert with that title already exists.', 400));

  const jobAlert = await JobAlert.create({
    user: req.user.id,
    title,
    region: region || '',
    city: city || '',
    jobType: jobType || '',
    keywords: keywords || '',
    frequency: frequency || 'daily',
    active: active === false ? false : true,
  });

  res.status(201).json({ success: true, data: jobAlert });
});

exports.updateJobAlert = asyncHandler(async (req, res, next) => {
  const updateFields = {};
  const allowed = ['title', 'region', 'city', 'jobType', 'keywords', 'frequency', 'active'];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updateFields[field] = req.body[field];
  });

  const updated = await JobAlert.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    updateFields,
    { new: true, runValidators: true }
  );

  if (!updated) return next(new AppError('Job alert not found.', 404));

  res.status(200).json({ success: true, data: updated });
});

exports.deleteJobAlert = asyncHandler(async (req, res, next) => {
  const deleted = await JobAlert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!deleted) return next(new AppError('Job alert not found.', 404));
  res.status(200).json({ success: true, message: 'Job alert deleted.' });
});
