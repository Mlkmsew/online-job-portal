// ============================================
// Job Controller
// ============================================
const Job = require('../models/job');
const Company = require('../models/Company');
const Bookmark = require('../models/Bookmark');
const { asyncHandler, paginate, escapeRegex } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const APIFeatures = require('../utils/apiFeatures');

const normalizeStringArray = (value) => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap(normalizeStringArray);
};

const APPLICATION_FIELD_TYPES = ['text', 'textarea', 'url', 'number'];

// Normalize employer-configured application fields. Preserves the `required`
// flag exactly as configured by the employer and drops empty/invalid entries.
const normalizeApplicationFields = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((field) => {
      if (!field || typeof field !== 'object') return null;
      const label = String(field.label || '').trim();
      if (!label) return null;
      return {
        label,
        type: APPLICATION_FIELD_TYPES.includes(field.type) ? field.type : 'text',
        required: field.required === true || field.required === 'true',
      };
    })
    .filter(Boolean);
};

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  // Jobs visible to the public: status published or active, and isApproved true
  const queryObj = { status: { $in: ['published', 'active'] }, isApproved: true };
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
  if (req.query.isFeatured === 'true') queryObj.isFeatured = true;
  if (req.query.isRemote === 'true') queryObj.isRemote = true;
  if (req.query.disabilityFriendly === 'true') queryObj['accessibility.disabilityFriendly'] = true;

  // Internship quick filter
  if (req.query.internship === 'true') queryObj.jobType = 'Internship';

  // Company name/type filtering for public job search
  const companyQuery = { isApproved: true, isActive: true };
  let companyFilterUsed = false;
  if (req.query.company) {
    companyQuery._id = req.query.company;
    companyFilterUsed = true;
  }
  if (req.query.companyName) {
    const safeCompanyName = escapeRegex(req.query.companyName);
    companyQuery.name = new RegExp(safeCompanyName, 'i');
    companyFilterUsed = true;
  }
  if (req.query.companyType) {
    const types = req.query.companyType.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length) {
      companyQuery.companyType = { $in: types };
      companyFilterUsed = true;
    }
  }

  const companyIds = await Company.distinct('_id', companyQuery);
  if (companyIds.length) {
    queryObj.company = { $in: companyIds };
  } else {
    queryObj.company = { $in: [] };
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

  // Jobs posted within the last N days
  if (req.query.postedWithinDays) {
    const days = parseInt(req.query.postedWithinDays, 10);
    if (!isNaN(days) && days > 0) {
      const now = new Date();
      const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      queryObj.createdAt = { $gte: threshold };
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

  const isOwner = req.user && job.postedBy && (
    (job.postedBy._id && job.postedBy._id.toString() === req.user.id) ||
    job.postedBy.toString() === req.user.id
  );
  const publicCanView =
    (job.status === 'published' || job.status === 'active') &&
    job.isApproved &&
    job.company?.isApproved &&
    job.company?.isActive;
  const canView = publicCanView || req.user?.role === 'admin' || isOwner;

  if (!canView) return next(new AppError('Job not found.', 404));

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
  req.body.isApproved = false;
  req.body.status = 'pending'; // Always start as pending — awaiting admin approval
  if (req.body.benefits !== undefined) {
    req.body.benefits = normalizeStringArray(req.body.benefits);
  }
  // Normalize skills payload if provided
  if (req.body.skills) {
    const skills = {
      technical: [],
      soft: [],
    };
    if (Array.isArray(req.body.skills.technical)) {
      skills.technical = req.body.skills.technical
        .filter(Boolean)
        .map((item) => item.toString().trim())
        .filter(Boolean);
    }
    if (Array.isArray(req.body.skills.soft)) {
      skills.soft = req.body.skills.soft
        .filter(Boolean)
        .map((item) => item.toString().trim())
        .filter(Boolean);
    }
    req.body.skills = skills;
  } else {
    req.body.skills = { technical: [], soft: [] };
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
  // Normalize employer-configured application fields (preserves required flag)
  if (req.body.applicationFields !== undefined) {
    req.body.applicationFields = normalizeApplicationFields(req.body.applicationFields);
  }
  const job = await Job.create(req.body);

  // Update company job count
  company.totalJobs += 1;
  await company.save({ validateBeforeSave: false });

  // Notify admins that a new job is awaiting approval.
  try {
    const { notifyAllAdmins } = require('../utils/helpers');
    notifyAllAdmins({
      type: 'job_pending_approval',
      title: 'Job awaiting approval',
      message: `"${job.title}" was submitted by ${company.name || 'an employer'} and requires admin approval.`,
      link: '/admin/jobs',
      data: { jobId: job._id },
      sender: req.user.id,
    });
  } catch (err) {
    console.error('Admin job-approval notification dispatch error:', err.message);
  }

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

  if (req.body.benefits !== undefined) {
    req.body.benefits = normalizeStringArray(req.body.benefits);
  }
  // Normalize skills payload if provided
  if (req.body.skills) {
    const skills = {
      technical: [],
      soft: [],
    };
    if (Array.isArray(req.body.skills.technical)) {
      skills.technical = req.body.skills.technical
        .filter(Boolean)
        .map((item) => item.toString().trim())
        .filter(Boolean);
    }
    if (Array.isArray(req.body.skills.soft)) {
      skills.soft = req.body.skills.soft
        .filter(Boolean)
        .map((item) => item.toString().trim())
        .filter(Boolean);
    }
    req.body.skills = skills;
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
  // Normalize employer-configured application fields (preserves required flag)
  if (req.body.applicationFields !== undefined) {
    req.body.applicationFields = normalizeApplicationFields(req.body.applicationFields);
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
    status: { $in: ['published', 'active'] },
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

// @desc    Get job recommendations for authenticated job seeker
// @route   GET /api/jobs/recommendations
// @access  Private (Job Seeker)
exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const User = require('../models/user');
  const Application = require('../models/Application');
  const Resume = require('../models/Resume');
  const { calculateJobMatch } = require('../utils/matching');
  const { canRecommendJobs, enrichUserFromResume } = require('../utils/dashboardHelpers');

  const userId = req.user.id || req.user._id;
  const user = await User.findById(userId).select('-password');
  if (!user) return next(new AppError('User not found.', 404));

  // Recommendations require an uploaded CV, a Resume Builder CV, or parsed CV
  // data on the profile.
  const resumeDoc = await Resume.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
  const hasCV = canRecommendJobs(user, resumeDoc);

  if (!hasCV) {
    return res.status(200).json({
      success: true,
      hasCV: false,
      count: 0,
      recommendations: [],
      data: [],
      message: 'Upload your CV to get job recommendations.',
    });
  }

  const profileForMatching = enrichUserFromResume(user, resumeDoc);

  // Get job IDs user has already applied to
  const appliedJobIds = new Set(
    (await Application.find({ applicant: userId }).select('job')).map((app) => app.job?.toString()).filter(Boolean)
  );

  const activeJobs = await Job.find({ status: { $in: ['published', 'active'] }, isApproved: true })
    .populate('company', 'name logo location')
    .populate('skillsRequired', 'name')
    .sort({ createdAt: -1 });

  const unappliedJobs = activeJobs.filter((j) => !appliedJobIds.has(j._id.toString()));

  const scoredJobs = unappliedJobs.map((job) => {
    const match = calculateJobMatch(job, profileForMatching);
    const score = match.matchScore ?? match.score ?? 0;

    return {
      _id: job._id.toString(),
      jobId: job._id.toString(),
      title: job.title,
      company: job.company?.name || 'Company',
      companyLogo: job.company?.logo || null,
      location: job.location?.city || job.location?.region || (job.workMode === 'Remote' ? 'Remote' : 'Addis Ababa'),
      jobType: job.jobType || 'Full-time',
      salary: job.salary,
      createdAt: job.createdAt,
      matchScore: score,
      matchPercentage: score,
      matchedSkills: match.matchedSkills || [],
      missingSkills: match.missingSkills || [],
      matchReasons: match.why || [],
      matchDetails: match.details || {},
    };
  });

  // Filter threshold >= 40 (fallback to top scoring if candidate profile is new)
  let recommendations = scoredJobs.filter((j) => j.matchScore >= 40);
  if (recommendations.length < 2) {
    recommendations = scoredJobs;
  }

  recommendations.sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt) - new Date(a.createdAt));
  recommendations = recommendations.slice(0, 10);

  res.status(200).json({
    success: true,
    hasCV: true,
    count: recommendations.length,
    recommendations,
    data: recommendations,
  });
});

module.exports = exports;
