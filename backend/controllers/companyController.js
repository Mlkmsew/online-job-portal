// ============================================
// Company Controller
// ============================================
const Company = require('../models/Company');
const Job = require('../models/Job');
const { asyncHandler, paginate, escapeRegex } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = asyncHandler(async (req, res) => {
  const query = { isApproved: true, isActive: true };
  if (req.query.industry) query.industry = req.query.industry;
  if (req.query.region) query['location.region'] = req.query.region;
  if (req.query.isFeatured === 'true') query.isFeatured = true;
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    query.$or = [
      { name: new RegExp(safeSearch, 'i') },
      { description: new RegExp(safeSearch, 'i') },
    ];
  }

  const { results, pagination } = await paginate(Company, query, req.query, ['owner']);
  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
exports.getCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
  }).populate('owner', 'firstName lastName avatar');

  if (!company) return next(new AppError('Company not found.', 404));

  // Increment views
  company.profileViews += 1;
  await company.save({ validateBeforeSave: false });

  // Get active jobs
  const jobs = await Job.find({ company: company._id, status: 'active' })
    .select('title jobType location applicationDeadline')
    .limit(10);

  res.status(200).json({ success: true, data: { ...company.toObject(), jobs } });
});

// @desc    Create company
// @route   POST /api/companies
// @access  Private (Employer)
exports.createCompany = asyncHandler(async (req, res, next) => {
  // Check if user already owns a company
  const existing = await Company.findOne({ owner: req.user.id });
  if (existing && req.user.role !== 'admin') {
    return next(new AppError('You already own a company. Contact support if you need to manage multiple companies.', 400));
  }

  req.body.owner = req.user.id;
  const company = await Company.create(req.body);
  res.status(201).json({ success: true, message: 'Company created! Waiting for admin approval.', data: company });
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Owner/Admin)
exports.updateCompany = asyncHandler(async (req, res, next) => {
  let company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));

  if (company.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  const allowedFields = [
    'name', 'description', 'shortDescription', 'tagline', 'industry', 'companySize',
    'foundedYear', 'companyType', 'website', 'email', 'phone', 'location',
    'socialLinks', 'benefits', 'techStack',
  ];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  company = await Company.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Company updated.', data: company });
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Owner/Admin)
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  await company.deleteOne();
  res.status(200).json({ success: true, message: 'Company deleted.' });
});

// @desc    Upload company logo
// @route   PUT /api/companies/:id/logo
// @access  Private (Owner)
exports.uploadLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image.', 400));

  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.owner.toString() !== req.user.id) return next(new AppError('Not authorized.', 403));

  company.logo = req.file.path;
  company.logoPublicId = req.file.filename;
  await company.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Logo updated.', logo: company.logo });
});

// @desc    Get my company (employer)
// @route   GET /api/companies/my/company
// @access  Private (Employer)
exports.getMyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ owner: req.user.id });
  if (!company) return next(new AppError('You do not own a company yet.', 404));
  res.status(200).json({ success: true, data: company });
});

module.exports = exports;
