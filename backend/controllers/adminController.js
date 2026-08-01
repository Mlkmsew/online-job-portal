// ============================================
// Admin Controller
// ============================================
const User = require('../models/user');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Category = require('../models/Category');
const Skill = require('../models/Skill');
const { asyncHandler, paginate, escapeRegex } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

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

// ========== USER MANAGEMENT ==========
exports.getUsers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.isEmailVerified) query.isEmailVerified = req.query.isEmailVerified === 'true';
  if (req.query.isSuspended) query.isSuspended = req.query.isSuspended === 'true';
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

exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('skills');
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, message: 'User updated.', data: user });
});

exports.suspendUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  user.isSuspended = !user.isSuspended;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `User ${user.isSuspended ? 'suspended' : 'activated'}.` });
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
  company.isApproved = !company.isApproved;
  await company.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Company ${company.isApproved ? 'approved' : 'unapproved'}.` });
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
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));
  job.isApproved = true;
  job.adminNote = req.body?.adminNote || 'Approved by admin.';
  await job.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: 'Job approved.' });
});

exports.rejectJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));
  job.isApproved = false;
  job.adminNote = req.body?.adminNote || 'Rejected by admin.';
  await job.save({ validateBeforeSave: false });
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
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, message: 'Category created.', data: category });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ success: true, message: 'Category updated.', data: category });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));
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
