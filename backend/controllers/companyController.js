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
  const normalizeNestedBodyObject = (field) => {
    if (typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        req.body[field] = req.body[field];
      }
    }
  };

  normalizeNestedBodyObject('location');
  normalizeNestedBodyObject('socialLinks');
  normalizeNestedBodyObject('recruiter');

  // Check if user already owns a company
  const existing = await Company.findOne({ owner: req.user.id });
  if (existing && req.user.role !== 'admin') {
    return next(new AppError('You already own a company. Contact support if you need to manage multiple companies.', 400));
  }

  const files = (function normalizeFiles(filesInput) {
    if (!filesInput) return {};

    let fileEntries = [];
    if (Array.isArray(filesInput)) {
      fileEntries = filesInput;
    } else if (filesInput && typeof filesInput === 'object') {
      fileEntries = Object.values(filesInput).flatMap((fileOrArray) => (Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray]));
    }

    if (!Array.isArray(fileEntries)) return {};

    return fileEntries.reduce((acc, file) => {
      if (!file || typeof file !== 'object' || !file.fieldname) return acc;
      if (!acc[file.fieldname]) acc[file.fieldname] = [];
      acc[file.fieldname].push(file);
      return acc;
    }, {});
  })(req.files);

  const normalizeMedia = (field) => {
    if (files[field]?.[0]) return files[field][0].path;
    const value = req.body[field];
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.url || value.path || '';
    return '';
  };

  req.body.logo = normalizeMedia('logo');
  req.body.coverImage = normalizeMedia('coverImage');

  if (!req.body.logo) {
    return next(new AppError('Please upload a company logo.', 400));
  }

  if (files.logo?.[0]) {
    req.body.logoPublicId = files.logo[0].filename;
  }

  if (files.coverImage?.[0]) {
    req.body.coverImagePublicId = files.coverImage[0].filename;
  }

  if (files.businessLicense?.[0]) {
    req.body.businessLicense = files.businessLicense[0].path;
    req.body.businessLicensePublicId = files.businessLicense[0].filename;
  }

  if (files.tinCertificate?.[0]) {
    req.body.tinCertificate = files.tinCertificate[0].path;
    req.body.tinCertificatePublicId = files.tinCertificate[0].filename;
  }

  if (files.companyRegistration?.[0]) {
    req.body.companyRegistration = files.companyRegistration[0].path;
    req.body.companyRegistrationPublicId = files.companyRegistration[0].filename;
  }

  req.body.owner = req.user.id;
  const company = await Company.create(req.body);
  res.status(201).json({ success: true, message: 'Company created! Waiting for admin approval.', data: company });
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Owner/Admin)
exports.updateCompany = asyncHandler(async (req, res, next) => {
  const normalizeNestedBodyObject = (field) => {
    if (typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        req.body[field] = req.body[field];
      }
    }
  };

  normalizeNestedBodyObject('location');
  normalizeNestedBodyObject('socialLinks');
  normalizeNestedBodyObject('recruiter');

  let company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));

  if (company.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  const sanitizeMediaField = (field) => {
    const value = req.body[field];
    if (value && typeof value === 'object') {
      const cleaned = typeof value.url === 'string' ? value.url : typeof value.path === 'string' ? value.path : '';
      if (cleaned) {
        req.body[field] = cleaned;
      } else {
        delete req.body[field];
      }
    }
  };

  sanitizeMediaField('logo');
  sanitizeMediaField('coverImage');

  const allowedFields = [
    'name', 'description', 'shortDescription', 'tagline', 'industry', 'companySize',
    'foundedYear', 'companyType', 'website', 'email', 'phone', 'location',
    'socialLinks', 'recruiter', 'benefits', 'techStack', 'logo', 'logoPublicId', 'coverImage', 'coverImagePublicId',
    'businessLicense', 'businessLicensePublicId', 'tinCertificate', 'tinCertificatePublicId',
    'companyRegistration', 'companyRegistrationPublicId', 'registrationNumber',
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
