// ============================================
// Job Controller
// ============================================
const Job = require('../models/Job');
const Company = require('../models/Company');
const Bookmark = require('../models/Bookmark');
const { asyncHandler, paginate, escapeRegex } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  const queryObj = { status: 'active', isApproved: true };
  let sortBy = '-createdAt';

  // Filters
  if (req.query.category) queryObj.category = req.query.category;
  if (req.query.jobType) queryObj.jobType = req.query.jobType;
  // support employmentType alias
  if (req.query.employmentType && !req.query.jobType) queryObj.jobType = req.query.employmentType;
  // workMode case-insensitive (supports remote/hybrid/on-site)
  if (req.query.workMode) queryObj.workMode = new RegExp(`^${escapeRegex(req.query.workMode)}$`, 'i');
  if (req.query.experienceLevel) queryObj.experienceLevel = req.query.experienceLevel;
  if (req.query.experience) queryObj.experienceLevel = req.query.experience;
  if (req.query.education) queryObj.educationRequired = req.query.education;
  if (req.query.region) queryObj['location.region'] = req.query.region;
  if (req.query.city) queryObj['location.city'] = new RegExp(escapeRegex(req.query.city), 'i');
  if (req.query.company) queryObj.company = req.query.company;
  if (req.query.companyName) {
    const safeCompanyName = escapeRegex(req.query.companyName);
    const comps = await Company.find({ name: new RegExp(safeCompanyName, 'i') }).select('_id');
    const ids = comps.map((c) => c._id);
    if (ids.length) queryObj.company = { $in: ids };
  }
  if (req.query.isFeatured === 'true') queryObj.isFeatured = true;
  if (req.query.isRemote === 'true') queryObj.isRemote = true;
  if (req.query.disabilityFriendly === 'true') queryObj['accessibility.disabilityFriendly'] = true;

  // Internship quick filter
  if (req.query.internship === 'true') queryObj.jobType = 'Internship';

  // Company type filter: accepts comma-separated values like 'Government,NGO,Private'
  if (req.query.companyType) {
    const types = req.query.companyType.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length) {
      const comps = await Company.find({ companyType: { $in: types } }).select('_id');
      const ids = comps.map((c) => c._id);
      if (ids.length) queryObj.company = { $in: ids };
    }
  }

  // Deadline within days: jobs expiring within next N days
  if (req.query.deadlineWithinDays) {
    const days = parseInt(req.query.deadlineWithinDays, 10);
    if (!isNaN(days) && days > 0) {
      const now = new Date();
      const then = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      queryObj.applicationDeadline = { $lte: then };
    }
  }

  // Skills (comma separated ids)
  if (req.query.skills) {
    const skills = req.query.skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (skills.length) queryObj.skillsRequired = { $in: skills };
  }

  // Tags
  if (req.query.tags) {
    const tags = req.query.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length) queryObj.tags = { $in: tags };
  }

  // Salary range
  if (req.query.minSalary) queryObj['salary.min'] = { $gte: parseInt(req.query.minSalary) };
  if (req.query.maxSalary) queryObj['salary.max'] = { $lte: parseInt(req.query.maxSalary) };

  // Text search
  const searchTerm = req.query.search || req.query.keywords || req.query.q;
  if (searchTerm) {
    // Prefer text index if available
    queryObj.$text = { $search: searchTerm };
  }

  // Sorting
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'newest':
        sortBy = '-createdAt';
        break;
      case 'deadline':
        sortBy = 'applicationDeadline';
        break;
      case 'highestSalary':
        sortBy = '-salary.max';
        break;
      case 'popular':
        sortBy = '-views';
        break;
      case 'recentlyUpdated':
        sortBy = '-updatedAt';
        break;
      default:
        sortBy = req.query.sort.split(',').join(' ');
    }
  }

  const { results, pagination } = await paginate(
    Job,
    queryObj,
    req.query,
    ['company', 'category', 'skillsRequired', 'postedBy'],
    sortBy
  );

  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Get single job by ID or slug
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
  })
    .populate('company')
    .populate('category')
    .populate('skillsRequired')
    .populate('postedBy', 'firstName lastName avatar');

  if (!job) return next(new AppError('Job not found.', 404));

  // Increment views
  job.views += 1;
  await job.save({ validateBeforeSave: false });

  // Check if user bookmarked
  let isBookmarked = false;
  if (req.user) {
    const bookmark = await Bookmark.findOne({ user: req.user.id, job: job._id });
    isBookmarked = !!bookmark;
  }

  res.status(200).json({ success: true, data: { ...job.toObject(), isBookmarked } });
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer only)
exports.createJob = asyncHandler(async (req, res, next) => {
  // Verify company ownership
  const company = await Company.findById(req.body.company);
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.owner.toString() !== req.user.id) {
    return next(new AppError('You do not own this company.', 403));
  }

  req.body.postedBy = req.user.id;
  // Normalize accessibility payload if provided
  if (req.body.accessibility) {
    req.body.accessibility = {
      disabilityFriendly: !!req.body.accessibility.disabilityFriendly,
      accommodations: req.body.accessibility.accommodations || '',
      accessibilityInfo: req.body.accessibility.accessibilityInfo || '',
      remoteFriendly: !!req.body.accessibility.remoteFriendly,
    };
  }
  const job = await Job.create(req.body);

  // Update company job count
  company.totalJobs += 1;
  await company.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, message: 'Job posted successfully!', data: job });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Owner/Admin)
exports.updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id).populate('company');
  if (!job) return next(new AppError('Job not found.', 404));

  // Check ownership
  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  // Normalize accessibility payload if provided
  if (req.body.accessibility) {
    req.body.accessibility = {
      disabilityFriendly: !!req.body.accessibility.disabilityFriendly,
      accommodations: req.body.accessibility.accommodations || '',
      accessibilityInfo: req.body.accessibility.accessibilityInfo || '',
      remoteFriendly: !!req.body.accessibility.remoteFriendly,
    };
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Job updated.', data: job });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Owner/Admin)
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  await job.deleteOne();
  res.status(200).json({ success: true, message: 'Job deleted.' });
});

// @desc    Get my jobs (employer)
// @route   GET /api/jobs/my/posted
// @access  Private (Employer)
exports.getMyJobs = asyncHandler(async (req, res) => {
  const { results, pagination } = await paginate(Job, { postedBy: req.user.id }, req.query, ['company', 'category']);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Close job
// @route   PUT /api/jobs/:id/close
// @access  Private (Owner)
exports.closeJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));
  if (job.postedBy.toString() !== req.user.id) return next(new AppError('Not authorized.', 403));

  job.status = 'closed';
  await job.save();
  res.status(200).json({ success: true, message: 'Job closed.', data: job });
});

// @desc    Get similar jobs
// @route   GET /api/jobs/:id/similar
// @access  Public
exports.getSimilarJobs = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  const similar = await Job.find({
    _id: { $ne: job._id },
    category: job.category,
    status: 'active',
    isApproved: true,
  })
    .limit(6)
    .populate('company', 'name logo')
    .populate('category', 'name');

  res.status(200).json({ success: true, count: similar.length, data: similar });
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats/overview
// @access  Public
exports.getJobStats = asyncHandler(async (req, res) => {
  const stats = await Job.aggregate([
    { $match: { status: 'active', isApproved: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgViews: { $avg: '$views' },
        avgApplicants: { $avg: '$applicantsCount' },
      },
    },
  ]);

  const byCategory = await Job.aggregate([
    { $match: { status: 'active', isApproved: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
  ]);

  const byRegion = await Job.aggregate([
    { $match: { status: 'active', isApproved: true } },
    { $group: { _id: '$location.region', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: { overview: stats[0] || {}, byCategory, byRegion },
  });
});

module.exports = exports;
