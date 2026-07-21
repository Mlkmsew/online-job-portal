// ============================================
// Admin Controller
// ============================================
const User = require('../models/user');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Category = require('../models/Category');
const Skill = require('../models/Skill');
const { asyncHandler, paginate } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// ========== DASHBOARD ANALYTICS ==========
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalEmployers, totalJobs, totalApplications, totalCompanies] = await Promise.all([
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments(),
    Application.countDocuments(),
    Company.countDocuments(),
  ]);

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
    query.$or = [
      { firstName: new RegExp(req.query.search, 'i') },
      { lastName: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
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
  if (req.query.isApproved !== undefined) query.isApproved = req.query.isApproved === 'true';
  if (req.query.isVerified !== undefined) query.isVerified = req.query.isVerified === 'true';

  const { results, pagination } = await paginate(Company, query, req.query, ['owner']);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
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
  job.isApproved = !job.isApproved;
  await job.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Job ${job.isApproved ? 'approved' : 'unapproved'}.` });
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
