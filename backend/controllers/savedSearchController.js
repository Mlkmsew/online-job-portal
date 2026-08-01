const SavedSearch = require('../models/SavedSearch');
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

exports.getSavedSearches = asyncHandler(async (req, res) => {
  const searches = await SavedSearch.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: searches.length, data: searches });
});

exports.createSavedSearch = asyncHandler(async (req, res, next) => {
  const { name, query, notifyOnNewJobs } = req.body;
  if (!name) return next(new AppError('Saved search name is required.', 400));

  const existing = await SavedSearch.findOne({ user: req.user.id, name });
  if (existing) return next(new AppError('A saved search with that name already exists.', 400));

  const savedSearch = await SavedSearch.create({
    user: req.user.id,
    name,
    query: query || {},
    notifyOnNewJobs: notifyOnNewJobs === true,
  });

  res.status(201).json({ success: true, data: savedSearch });
});

exports.updateSavedSearch = asyncHandler(async (req, res, next) => {
  const updateFields = {};
  const allowed = ['name', 'query', 'notifyOnNewJobs'];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updateFields[field] = req.body[field];
  });

  const updated = await SavedSearch.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    updateFields,
    { new: true, runValidators: true }
  );

  if (!updated) return next(new AppError('Saved search not found.', 404));

  res.status(200).json({ success: true, data: updated });
});

exports.deleteSavedSearch = asyncHandler(async (req, res, next) => {
  const deleted = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!deleted) return next(new AppError('Saved search not found.', 404));
  res.status(200).json({ success: true, message: 'Saved search deleted.' });
});

exports.toggleSavedSearchNotify = asyncHandler(async (req, res, next) => {
  const savedSearch = await SavedSearch.findOne({ _id: req.params.id, user: req.user.id });
  if (!savedSearch) return next(new AppError('Saved search not found.', 404));

  savedSearch.notifyOnNewJobs = !savedSearch.notifyOnNewJobs;
  await savedSearch.save();

  res.status(200).json({ success: true, data: savedSearch });
});
