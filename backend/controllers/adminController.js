// ============================================
// Admin Controller
// ============================================
const User = require('../models/user');
const Company = require('../models/Company');
const Job = require('../models/job');
const Application = require('../models/Application');
const Category = require('../models/Category');
const Skill = require('../models/Skill');
const Notification = require('../models/Notification');
const { asyncHandler, paginate, escapeRegex, createNotification } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// ========== APPLICATION MANAGEMENT ==========
// Mapping of the Admin UI status buckets to the Application model statuses.
// Kept in one place so the list filter and the statistics cards stay in sync.
const ADMIN_STATUS_GROUPS = {
  Pending: ['Submitted'],
  'Under Review': ['Reviewed', 'Shortlisted'],
  Interview: ['Interview', 'Interview Scheduled', 'Interview Completed', 'Interview Cancelled'],
  Hired: ['Selected', 'Hired', 'accepted'],
  Rejected: ['Rejected', 'Not Selected'],
};

const buildAdminStatusStats = async () => {
  const grouped = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(grouped.map(({ _id, count }) => [_id, count]));
  const sumOf = (keys) => keys.reduce((acc, key) => acc + (byStatus[key] || 0), 0);
  const allKeys = Object.keys(byStatus);
  return {
    total: sumOf(allKeys),
    pending: sumOf(ADMIN_STATUS_GROUPS.Pending),
    underReview: sumOf(ADMIN_STATUS_GROUPS['Under Review']),
    interview: sumOf(ADMIN_STATUS_GROUPS.Interview),
    hired: sumOf(ADMIN_STATUS_GROUPS.Hired),
    rejected: sumOf(ADMIN_STATUS_GROUPS.Rejected),
  };
};

// @desc    Get all applications (admin application management)
// @route   GET /api/admin/applications
// @access  Private (Admin)
exports.getAdminApplications = asyncHandler(async (req, res) => {
  const query = {};

  // Status bucket filter (Pending / Under Review / Interview / Hired / Rejected)
  if (req.query.status && req.query.status !== 'all') {
    const statuses = ADMIN_STATUS_GROUPS[req.query.status];
    query.status = statuses && statuses.length ? { $in: statuses } : req.query.status;
  }

  // Search across applicant name/email, job title and company name
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    const [matchedUsers, matchedJobs, matchedCompanies] = await Promise.all([
      User.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).select('_id').lean(),
      Job.find({ title: regex }).select('_id').lean(),
      Company.find({ name: regex }).select('_id').lean(),
    ]);

    const orConditions = [];
    if (matchedUsers.length) orConditions.push({ applicant: { $in: matchedUsers.map((u) => u._id) } });
    if (matchedJobs.length) orConditions.push({ job: { $in: matchedJobs.map((j) => j._id) } });
    if (matchedCompanies.length) orConditions.push({ company: { $in: matchedCompanies.map((c) => c._id) } });
    // Empty result if nothing matched anywhere (instead of returning everything)
    query.$or = orConditions.length ? orConditions : [{ _id: null }];
  }

  // Stats cover ALL applications so the cards are stable regardless of filter page
  const [stats, { results, pagination }] = await Promise.all([
    buildAdminStatusStats(),
    paginate(Application, query, req.query, [
      { path: 'job', populate: { path: 'company', select: 'name logo website industry' } },
      { path: 'applicant', populate: { path: 'skills' } },
      { path: 'company', select: 'name logo website industry' },
      { path: 'employer', select: 'firstName lastName email' },
    ], '-appliedAt'),
  ]);

  res.status(200).json({
    success: true,
    count: results.length,
    pagination,
    stats,
    data: results,
  });
});

// @desc    Delete an application (spam / invalid submissions)
// @route   DELETE /api/admin/applications/:id
// @access  Private (Admin)
exports.deleteApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);
  if (!application) return next(new AppError('Application not found.', 404));

  await application.deleteOne();

  // Keep the job's applicant counter in sync
  if (application.job) {
    await Job.findByIdAndUpdate(application.job, { $inc: { applicantsCount: -1 } });
  }

  res.status(200).json({ success: true, message: 'Application deleted.' });
});

// ========== DASHBOARD ANALYTICS ==========
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [regularUsersCount, totalEmployers, totalJobs, totalApplications, totalCompanies] = await Promise.all([
    User.countDocuments({ role: { $in: ['jobseeker', 'employer'] } }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments(),
    Application.countDocuments(),
    Company.countDocuments(),
  ]);

  const totalUsers = regularUsersCount;

  const activeJobs = await Job.countDocuments({ status: 'active' });
  const pendingCompanies = await Company.countDocuments({ isApproved: false });

  // Monthly growth (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const jobGrowth = await Job.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Top categories
  const topCategories = await Job.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
  ]);

  // Application stats
  const applicationStats = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalEmployers,
        totalJobs,
        activeJobs,
        totalApplications,
        totalCompanies,
        pendingCompanies,
      },
      growth: { users: userGrowth, jobs: jobGrowth },
      topCategories,
      applicationStats,
    },
  });
});

// ========== REPORTS & STATISTICS ==========
// Build a zero-filled daily series for the last N days from a grouped
// { _id: 'YYYY-MM-DD', count } aggregation so the frontend can plot a
// continuous line chart (empty days are 0 instead of missing).
const fillDailySeries = (days, groupBy) => {
  const map = new Map();
  const series = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
    series.push({ date: key, count: 0 });
  }
  groupBy.forEach(({ _id, count }) => {
    if (map.has(_id)) map.set(_id, count);
  });
  return series.map((item) => ({ ...item, count: map.get(item.date) }));
};

exports.getReportsStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Summary counts (all run in parallel)
  const [
    totalCompanies,
    totalApplications,
    totalJobSeekers,
    totalEmployers,
    activeJobs,
    pendingJobs,
    pendingCompanies,
    hiredCandidates,
    rejectedApplications,
  ] = await Promise.all([
    Company.countDocuments(),
    Application.countDocuments(),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments({ status: { $in: ['published', 'active'] }, isApproved: true }),
    Job.countDocuments({ status: 'pending', isApproved: false }),
    Company.countDocuments({ isApproved: false }),
    Application.countDocuments({ status: /^(selected|hired|accepted)$/i }),
    Application.countDocuments({ status: /^(rejected|not selected)$/i }),
  ]);

  // Chart data (aggregations)
  const [
    applicationsByStatus,
    jobsByCategory,
    jobsOverTime,
    applicationsOverTime,
    topCompanies,
  ] = await Promise.all([
    Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$category.name', 'Uncategorized'] }, count: 1 } },
    ]),

    Job.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    Application.aggregate([
      { $match: { appliedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    Application.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$company.name', 'Unknown Company'] }, count: 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalCompanies,
        totalApplications,
        totalJobSeekers,
        totalEmployers,
        activeJobs,
        pendingJobs,
        pendingCompanies,
        hiredCandidates,
        rejectedApplications,
      },
      charts: {
        applicationsByStatus,
        jobsByCategory,
        jobsOverTime: fillDailySeries(30, jobsOverTime),
        applicationsOverTime: fillDailySeries(30, applicationsOverTime),
        topCompanies,
      },
    },
  });
});

// ========== PLATFORM ACTIVITY ==========
// Range parameter matches the dashboard UI toggles: 7d | 30d | 3m
const ACTIVITY_RANGES = {
  '7d': { days: 7, bucketMs: 24 * 60 * 60 * 1000 },
  '30d': { days: 30, bucketMs: 24 * 60 * 60 * 1000 },
  '3m': { days: 90, bucketMs: 7 * 24 * 60 * 60 * 1000 },
};

// Map per-day aggregation results into contiguous chart buckets (daily for
// 7D/30D, weekly for 3M) so the line chart plots every interval with 0-filled gaps.
const bucketActivitySeries = (groupBy, startMs, numBuckets, bucketMs) => {
  const byDate = new Map(groupBy.map(({ _id, count }) => [_id, count]));
  const series = new Array(numBuckets).fill(0);
  byDate.forEach((count, key) => {
    const dayStart = Date.parse(`${key}T00:00:00Z`);
    if (Number.isNaN(dayStart) || dayStart < startMs) return;
    const idx = Math.floor((dayStart - startMs) / bucketMs);
    if (idx >= 0 && idx < numBuckets) series[idx] += count;
  });
  return series;
};

// @desc    Platform Activity — new users/companies/jobs/applications over time
// @route   GET /api/admin/dashboard/activity?range=7d|30d|3m
// @access  Private (Admin)
exports.getPlatformActivity = asyncHandler(async (req, res) => {
  const cfg = ACTIVITY_RANGES[String(req.query.range || '30d').toLowerCase()] || ACTIVITY_RANGES['30d'];
  const { days, bucketMs } = cfg;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const dateStr = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: `$${field}` } });

  // Same population as the "Total Users" card (excludes admin accounts) so the
  // two numbers can never disagree.
  const regularUserFilter = { role: { $in: ['jobseeker', 'employer'] }, createdAt: { $gte: cutoff } };

  const [
    newUsers,
    newCompanies,
    newJobs,
    newApplications,
    usersByDate,
    companiesByDate,
    jobsByDate,
    applicationsByDate,
  ] = await Promise.all([
    User.countDocuments(regularUserFilter),
    Company.countDocuments({ createdAt: { $gte: cutoff } }),
    Job.countDocuments({ createdAt: { $gte: cutoff } }),
    Application.countDocuments({ appliedAt: { $gte: cutoff } }),
    User.aggregate([{ $match: regularUserFilter }, { $group: { _id: dateStr('createdAt'), count: { $sum: 1 } } }]),
    Company.aggregate([{ $match: { createdAt: { $gte: cutoff } } }, { $group: { _id: dateStr('createdAt'), count: { $sum: 1 } } }]),
    Job.aggregate([{ $match: { createdAt: { $gte: cutoff } } }, { $group: { _id: dateStr('createdAt'), count: { $sum: 1 } } }]),
    Application.aggregate([{ $match: { appliedAt: { $gte: cutoff } } }, { $group: { _id: dateStr('appliedAt'), count: { $sum: 1 } } }]),
  ]);

  // Chart buckets aligned to the selected period, labels mirror the range toggle
  const numBuckets = Math.ceil((days * 24 * 60 * 60 * 1000) / bucketMs);
  const alignedEnd = Math.floor(Date.now() / bucketMs) * bucketMs;
  const startMs = alignedEnd - (numBuckets - 1) * bucketMs;
  const labels = [];
  for (let i = 0; i < numBuckets; i += 1) {
    labels.push(new Date(startMs + i * bucketMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  res.status(200).json({
    success: true,
    data: {
      counts: {
        users: newUsers,
        companies: newCompanies,
        jobs: newJobs,
        applications: newApplications,
      },
      chart: {
        labels,
        users: bucketActivitySeries(usersByDate, startMs, numBuckets, bucketMs),
        companies: bucketActivitySeries(companiesByDate, startMs, numBuckets, bucketMs),
        jobs: bucketActivitySeries(jobsByDate, startMs, numBuckets, bucketMs),
        applications: bucketActivitySeries(applicationsByDate, startMs, numBuckets, bucketMs),
      },
    },
  });
});

// ========== USER MANAGEMENT ==========
// Values accepted by PATCH /users/:id/status (normalized onto the User.status enum).
const VALID_USER_STATUSES = ['pending', 'active', 'approved', 'suspended', 'rejected'];

const normalizeUserStatus = (value) => (value === 'approved' ? 'active' : value);

const applyUserStatus = (user, status, reason) => {
  user.status = status;
  user.rejectionReason = status === 'rejected' ? reason || '' : '';
  switch (status) {
    case 'suspended':
      user.isSuspended = true;
      user.isActive = true;
      break;
    case 'rejected':
      user.isSuspended = false;
      user.isActive = false;
      break;
    default: // pending / active
      user.isSuspended = false;
      user.isActive = true;
      break;
  }
};

exports.getUsers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.isEmailVerified) query.isEmailVerified = req.query.isEmailVerified === 'true';
  if (req.query.isSuspended) query.isSuspended = req.query.isSuspended === 'true';
  if (req.query.status && VALID_USER_STATUSES.includes(req.query.status)) {
    query.status = normalizeUserStatus(req.query.status);
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    query.$or = [
      { firstName: new RegExp(safeSearch, 'i') },
      { lastName: new RegExp(safeSearch, 'i') },
      { email: new RegExp(safeSearch, 'i') },
    ];
  }

  const { results, pagination } = await paginate(User, query, req.query, []);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Get a single user with their complete stored profile.
//          Job Seekers return their profile/skills/education/experience/CV.
//          Employers additionally return their Company document and its jobs,
//          so the Admin page reflects exactly what the user entered themselves.
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('skills');
  if (!user) return next(new AppError('User not found.', 404));

  const payload = { user: user.toObject() };

  if (user.role === 'employer') {
    const company = await Company.findOne({ owner: user._id }).populate(
      'owner',
      'firstName lastName avatar email phone'
    );
    payload.company = company || null;

    let jobs = [];
    if (company) {
      jobs = await Job.find({ company: company._id })
        .populate('category', 'name')
        .select(
          'title status isApproved isFeatured jobType workMode location salary applicantsCount applicationDeadline createdAt'
        )
        .sort({ createdAt: -1 });
    }
    payload.jobs = jobs;
  }

  res.status(200).json({ success: true, data: payload });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, message: 'User updated.', data: user });
});

// @desc    Approve / Reject / Suspend / Activate a user
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin') {
    return next(new AppError('Admin accounts cannot be managed here.', 400));
  }

  const requested = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';
  if (!VALID_USER_STATUSES.includes(requested)) {
    return next(new AppError(`Invalid status. Use one of: ${VALID_USER_STATUSES.join(', ')}.`, 400));
  }

  if (req.user.id.toString() === user._id.toString()) {
    return next(new AppError('You cannot change your own account status.', 400));
  }

  const status = normalizeUserStatus(requested);
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

  if (status === 'rejected' && !reason) {
    return next(new AppError('A rejection reason is required.', 400));
  }

  applyUserStatus(user, status, reason);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `User status updated to '${status}'.`,
    data: user,
  });
});

exports.suspendUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin') return next(new AppError('Admin accounts cannot be suspended.', 400));

  const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
  applyUserStatus(user, nextStatus);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `User ${nextStatus === 'suspended' ? 'suspended' : 'activated'}.`, data: user });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted.' });
});

// ========== COMPANY MANAGEMENT ==========
exports.getCompanies = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    query.$or = [
      { name: new RegExp(safeSearch, 'i') },
      { industry: new RegExp(safeSearch, 'i') },
      { email: new RegExp(safeSearch, 'i') },
      { website: new RegExp(safeSearch, 'i') },
    ];
  }

  if (req.query.industry) query.industry = req.query.industry;

  if (req.query.status) {
    if (req.query.status === 'Approved') {
      query.isApproved = true;
    } else if (req.query.status === 'Pending') {
      query.$and = [{ isApproved: false }, { $or: [{ isActive: { $exists: false } }, { isActive: true }] }];
    } else if (req.query.status === 'Rejected') {
      query.isApproved = false;
      query.isActive = false;
    }
  }

  if (req.query.isVerified !== undefined) query.isVerified = req.query.isVerified === 'true';

  const { results, pagination } = await paginate(Company, query, req.query, ['owner']);
  const companyIds = results.map((company) => company._id);
  const jobs = await Job.find({ company: { $in: companyIds } })
    .select('title status isApproved company applicantsCount')
    .sort({ createdAt: -1 });

  const jobsByCompany = jobs.reduce((acc, job) => {
    const companyId = job.company?.toString();
    if (!companyId) return acc;
    if (!acc[companyId]) acc[companyId] = [];
    acc[companyId].push(job);
    return acc;
  }, {});

  const companiesWithJobs = results.map((company) => {
    const companyObj = company.toObject();
    const companyId = companyObj._id?.toString();
    companyObj.jobs = companyId ? jobsByCompany[companyId] || [] : [];
    return companyObj;
  });

  res.status(200).json({ success: true, count: companiesWithJobs.length, pagination, data: companiesWithJobs });
});

exports.approveCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.isApproved) {
    return next(new AppError('Company is already approved.', 400));
  }

  company.isApproved = true;
  company.isActive = true;
  company.rejectionReason = '';
  company.reviewedBy = req.user.id;
  company.reviewedAt = new Date();
  await company.save({ validateBeforeSave: false });

  if (company.owner) {
    try {
      await createNotification({
        recipient: company.owner,
        type: 'company_approved',
        title: 'Company approved',
        message: `Your company "${company.name}" has been approved and is now visible to job seekers.`,
        link: '/employer/company',
        data: { companyId: company._id },
        sender: req.user.id,
      });
    } catch (notifErr) {
      console.error('Company approved notification error:', notifErr.message);
    }
  }

  res.status(200).json({ success: true, message: 'Company approved.' });
});

exports.rejectCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.isApproved) {
    return next(new AppError('Company is already approved. Revoke approval before rejecting.', 400));
  }
  if (company.isActive === false && company.rejectionReason) {
    return next(new AppError('Company has already been rejected.', 400));
  }

  const rejectionReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!rejectionReason) {
    return next(new AppError('A rejection reason is required.', 400));
  }

  company.isApproved = false;
  company.isActive = false;
  company.rejectionReason = rejectionReason;
  company.reviewedBy = req.user.id;
  company.reviewedAt = new Date();
  await company.save({ validateBeforeSave: false });

  if (company.owner) {
    try {
      await createNotification({
        recipient: company.owner,
        type: 'company_rejected',
        title: 'Company profile rejected',
        message: `Your company profile "${company.name}" was not approved. Reason: ${rejectionReason}`,
        link: '/employer/company',
        data: { companyId: company._id },
        sender: req.user.id,
      });
    } catch (notifErr) {
      console.error('Company rejected notification error:', notifErr.message);
    }
  }

  res.status(200).json({ success: true, message: 'Company rejected.' });
});

exports.verifyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  company.isVerified = !company.isVerified;
  await company.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Company ${company.isVerified ? 'verified' : 'unverified'}.` });
});

exports.featureCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  company.isFeatured = !company.isFeatured;
  await company.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Company ${company.isFeatured ? 'featured' : 'unfeatured'}.` });
});

// ========== JOB MANAGEMENT ==========
exports.getJobs = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.isApproved !== undefined) query.isApproved = req.query.isApproved === 'true';

  const { results, pagination } = await paginate(Job, query, req.query, ['company', 'category', 'postedBy']);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

exports.approveJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate('company', 'name');
  if (!job) return next(new AppError('Job not found.', 404));

  const wasAlreadyApproved = job.isApproved;

  // Mark as approved & published
  job.isApproved = true;
  job.status = 'published';
  if (!wasAlreadyApproved) {
    job.publishedAt = new Date();
  }
  job.adminNote = req.body?.adminNote || 'Approved by admin.';
  await job.save({ validateBeforeSave: false });

  // Fan-out new_job notifications — only on first approval.
  // insertMany with ordered:false means MongoDB silently skips documents that
  // violate the unique (recipient, type, data.jobId) index, so calling this
  // endpoint a second time never creates duplicates.
  if (!wasAlreadyApproved) {
    try {
      const jobseekers = await User.find(
        { role: 'jobseeker', isSuspended: { $ne: true } },
        { _id: 1 }
      ).lean();

      if (jobseekers.length > 0) {
        const companyName = job.company?.name || 'A company';
        const locationStr =
          [job.location?.city, job.location?.region].filter(Boolean).join(', ') || 'Ethiopia';

        const notifications = jobseekers.map((seeker) => ({
          recipient: seeker._id,
          type: 'new_job',
          title: 'New Job Posted',
          message: 'A new job has been approved and published.',
          link: `/jobs/${job._id}`,
          data: {
            jobId: job._id,
            jobTitle: job.title,
            companyName,
            location: locationStr,
            jobType: job.jobType,
          },
        }));

        // ordered:false → continues inserting even if some docs hit the unique index
        await Notification.insertMany(notifications, { ordered: false });
      }
    } catch (notifErr) {
      // Code 11000 = duplicate key — expected on retry, safe to ignore
      if (notifErr.code !== 11000 && notifErr.writeErrors?.some((e) => e.code !== 11000)) {
        console.error('Job alert fan-out error:', notifErr.message);
      }
    }
  }

  if (job.postedBy) {
    try {
      await createNotification({
        recipient: job.postedBy,
        type: 'job_approved',
        title: 'Job approved',
        message: `Your job posting "${job.title}" has been approved and is now published.`,
        link: '/employer/jobs',
        data: { jobId: job._id },
        sender: req.user.id,
      });
    } catch (notifErr) {
      console.error('Job approved notification error:', notifErr.message);
    }
  }

  res.status(200).json({ success: true, message: 'Job approved and published.' });
});

exports.rejectJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));
  job.isApproved = false;
  job.status = 'pending';
  job.publishedAt = undefined;
  job.adminNote = req.body?.adminNote || 'Rejected by admin.';
  await job.save({ validateBeforeSave: false });

  if (job.postedBy) {
    try {
      await createNotification({
        recipient: job.postedBy,
        type: 'job_rejected',
        title: 'Job posting rejected',
        message: `Your job posting "${job.title}" was not approved.`,
        link: '/employer/jobs',
        data: { jobId: job._id },
        sender: req.user.id,
      });
    } catch (notifErr) {
      console.error('Job rejected notification error:', notifErr.message);
    }
  }

  res.status(200).json({ success: true, message: 'Job rejected.' });
});

exports.featureJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));
  job.isFeatured = !job.isFeatured;
  await job.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Job ${job.isFeatured ? 'featured' : 'unfeatured'}.` });
});

// ========== CATEGORY MANAGEMENT ==========
const CATEGORY_FIELDS = ['name', 'description', 'icon', 'color', 'image', 'order', 'isActive', 'parent'];

// Pick only the fields the API is allowed to change (never trust req.body wholesale).
const pickCategoryFields = (body = {}) =>
  Object.fromEntries(CATEGORY_FIELDS.filter((field) => field in body).map((field) => [field, body[field]]));

// Normalize a category name: collapse whitespace, trim edges, strip empty.
const normalizeCategoryName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

// Build the slug the same way the model hook does, so admin updates stay in sync.
const makeCategorySlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

// Case-insensitive duplicate lookup (model unique index is a safety net, this gives a friendly message).
const findDuplicateCategory = async (name, excludeId) => {
  const query = { name: new RegExp(`^${escapeRegex(name)}$`, 'i') };
  if (excludeId) query._id = { $ne: excludeId };
  return Category.findOne(query);
};

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 });
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const name = normalizeCategoryName(req.body?.name);
  if (!name) return next(new AppError('Category name is required.', 400));

  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

  if (await findDuplicateCategory(name)) {
    return next(new AppError('This category already exists.', 409));
  }

  const category = await Category.create({
    ...pickCategoryFields(req.body),
    name,
    description,
    slug: makeCategorySlug(name),
  });
  res.status(201).json({ success: true, message: 'Category created.', data: category });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const updates = pickCategoryFields(req.body);

  if ('name' in updates) {
    const name = normalizeCategoryName(updates.name);
    if (!name) return next(new AppError('Category name is required.', 400));
    updates.name = name;
    updates.slug = makeCategorySlug(name);

    if (await findDuplicateCategory(name, req.params.id)) {
      return next(new AppError('This category already exists.', 409));
    }
  }

  if ('description' in updates) {
    updates.description = typeof updates.description === 'string' ? updates.description.trim() : '';
  }

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ success: true, message: 'Category updated.', data: category });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  // Never blind-delete: a category referenced by jobs would orphan those records.
  const usedByJobs = await Job.countDocuments({ category: category._id });
  if (usedByJobs > 0) {
    return next(
      new AppError('This category cannot be deleted because it is currently being used by existing jobs.', 409)
    );
  }

  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category deleted.' });
});

// ========== SKILL MANAGEMENT ==========
exports.getSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find().sort('name');
  res.status(200).json({ success: true, count: skills.length, data: skills });
});

exports.createSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.create(req.body);
  res.status(201).json({ success: true, message: 'Skill created.', data: skill });
});

exports.updateSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!skill) return next(new AppError('Skill not found.', 404));
  res.status(200).json({ success: true, message: 'Skill updated.', data: skill });
});

exports.deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) return next(new AppError('Skill not found.', 404));
  await skill.deleteOne();
  res.status(200).json({ success: true, message: 'Skill deleted.' });
});

module.exports = exports;
