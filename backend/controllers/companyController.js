// ============================================
// Company Controller
// ============================================
const Company = require('../models/Company');
const Job = require('../models/job');
const { cloudinary } = require('../config/cloudinary');
const { asyncHandler, paginate, escapeRegex, notifyAllAdmins } = require('../utils/helpers');
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

  const companyIds = results.map((c) => c._id);
  const now = new Date();
  const openJobs = await Job.aggregate([
    {
      $match: {
        company: { $in: companyIds },
        status: { $in: ['published', 'active'] },
        isApproved: true,
        applicationDeadline: { $gt: now },
      },
    },
    { $group: { _id: '$company', count: { $sum: 1 } } },
  ]);
  const openCounts = {};
  openJobs.forEach((j) => {
    openCounts[String(j._id)] = j.count;
  });

  const data = results.map((c) => {
    const obj = c.toObject ? c.toObject() : { ...c };
    return { ...obj, openPositions: openCounts[String(c._id)] || 0 };
  });

  res.status(200).json({ success: true, count: data.length, pagination, data });
});

// @desc    Get trusted companies (approved + active) with open job counts
// @route   GET /api/companies/trusted
// @access  Public
exports.getTrustedCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({
    isApproved: true,
    isActive: true,
  })
    .select('name slug logo industry isVerified location companySize')
    .limit(20)
    .lean();

  const companyIds = companies.map((c) => c._id);
  const now = new Date();

  const openJobs = await Job.aggregate([
    {
      $match: {
        company: { $in: companyIds },
        status: { $in: ['published', 'active'] },
        isApproved: true,
        applicationDeadline: { $gt: now },
      },
    },
    { $group: { _id: '$company', count: { $sum: 1 } } },
  ]);

  const openCounts = {};
  openJobs.forEach((j) => {
    openCounts[String(j._id)] = j.count;
  });

  const data = companies.map((c) => ({
    ...c,
    openPositions: openCounts[String(c._id)] || 0,
  }));

  res.status(200).json({ success: true, count: data.length, data });
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

  // Get open jobs — same filter used by the list/trusted endpoints so counts always match
  const jobs = await Job.find({
    company: company._id,
    status: { $in: ['published', 'active'] },
    isApproved: true,
    applicationDeadline: { $gt: new Date() },
  })
    .select('title jobType location applicationDeadline salary workMode')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, data: { ...company.toObject(), jobs } });
});

// @desc    Create company
// @route   POST /api/companies
// @access  Private (Employer/Admin)
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

  // Prevent duplicate company names
  if (req.body.name) {
    const existingByName = await Company.findOne({ name: req.body.name.trim() });
    if (existingByName) {
      return next(new AppError('A company with that name already exists.', 400));
    }
  }

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
    req.body.businessLicenseName = files.businessLicense[0].originalname;
    req.body.businessLicenseMime = files.businessLicense[0].mimetype;
  }

  if (files.tinCertificate?.[0]) {
    req.body.tinCertificate = files.tinCertificate[0].path;
    req.body.tinCertificatePublicId = files.tinCertificate[0].filename;
    req.body.tinCertificateName = files.tinCertificate[0].originalname;
    req.body.tinCertificateMime = files.tinCertificate[0].mimetype;
  }

  if (files.companyRegistration?.[0]) {
    req.body.companyRegistration = files.companyRegistration[0].path;
    req.body.companyRegistrationPublicId = files.companyRegistration[0].filename;
    req.body.companyRegistrationName = files.companyRegistration[0].originalname;
    req.body.companyRegistrationMime = files.companyRegistration[0].mimetype;
  }

  // Admin-created companies are considered approved and active by default.
  if (req.user.role === 'admin') {
    req.body.isApproved = true;
    req.body.isActive = true;
  }

  req.body.owner = req.user.id;
  const company = await Company.create(req.body);

  // Notify admins when a company profile is awaiting moderation (non-admin owners only).
  if (req.user.role !== 'admin') {
    notifyAllAdmins({
      type: 'company_pending_approval',
      title: 'Company awaiting approval',
      message: `${company.name} submitted a company profile for approval.`,
      link: '/admin/companies',
      data: { companyId: company._id },
      sender: req.user.id,
    });
  }

  res.status(201).json({
    success: true,
    message: req.user.role === 'admin' ? 'Company created and approved.' : 'Company created! Waiting for admin approval.',
    data: company,
  });
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

  // Normalize the multer file map into fieldname -> [files] (same shape used by createCompany)
  const files = (function normalizeFiles(filesInput) {
    if (!filesInput) return {};

    let fileEntries = [];
    if (Array.isArray(filesInput)) {
      fileEntries = filesInput;
    } else if (filesInput && typeof filesInput === 'object') {
      fileEntries = Object.values(filesInput).flatMap((fileOrArray) =>
        Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray]
      );
    }

    if (!Array.isArray(fileEntries)) return {};

    return fileEntries.reduce((acc, file) => {
      if (!file || typeof file !== 'object' || !file.fieldname) return acc;
      if (!acc[file.fieldname]) acc[file.fieldname] = [];
      acc[file.fieldname].push(file);
      return acc;
    }, {});
  })(req.files);

  // For each media/document field:
  //  - a newly uploaded file wins -> persist its Cloudinary SECURE URL + public id
  //  - otherwise keep an explicitly provided string (existing URL) or clear it (empty string)
  //  - when nothing is provided the existing database value is left untouched
  const handleMediaField = (field) => {
    if (files[field]?.[0]) {
      req.body[field] = files[field][0].path;
      req.body[`${field}PublicId`] = files[field][0].filename;
      req.body[`${field}Name`] = files[field][0].originalname;
      req.body[`${field}Mime`] = files[field][0].mimetype;
      return;
    }

    if (req.body[field] === undefined) return;

    const value = req.body[field];
    if (typeof value === 'string') {
      req.body[field] = value; // existing URL, or empty string for intentional removal
      // When a document is intentionally removed, also clear its name + mime.
      if (value === '' && ['businessLicense', 'tinCertificate', 'companyRegistration'].includes(field)) {
        req.body[`${field}Name`] = '';
        req.body[`${field}Mime`] = '';
      }
    } else if (value && typeof value === 'object') {
      req.body[field] = typeof value.url === 'string' ? value.url : typeof value.path === 'string' ? value.path : '';
    } else {
      delete req.body[field];
    }
  };

  ['logo', 'coverImage', 'businessLicense', 'tinCertificate', 'companyRegistration'].forEach(handleMediaField);

  const allowedFields = [
    'name', 'description', 'shortDescription', 'tagline', 'industry', 'companySize',
    'foundedYear', 'companyType', 'website', 'email', 'phone', 'location',
    'socialLinks', 'recruiter', 'benefits', 'techStack', 'logo', 'logoPublicId', 'coverImage', 'coverImagePublicId',
    'businessLicense', 'businessLicensePublicId', 'businessLicenseName', 'businessLicenseMime',
    'tinCertificate', 'tinCertificatePublicId', 'tinCertificateName', 'tinCertificateMime',
    'companyRegistration', 'companyRegistrationPublicId', 'companyRegistrationName', 'companyRegistrationMime',
    'registrationNumber',
  ];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  company = await Company.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Company updated.', data: company });
});

// @desc    Admin: stream a company verification document (proxy to Cloudinary)
// @route   GET /api/admin/companies/:id/documents/:docType
// @access  Private (Admin) - authenticated via protectPreview
// The browser never talks to Cloudinary directly and credentials stay server-side.
// Only the document that belongs to the requested company record is ever fetched,
// and only from our own Cloudinary account (no open proxy for arbitrary URLs).
exports.previewCompanyDocument = asyncHandler(async (req, res, next) => {
  const { id, docType } = req.params;
  const fieldMap = {
    businessLicense: 'businessLicense',
    tinCertificate: 'tinCertificate',
    companyRegistration: 'companyRegistration',
  };
  const field = fieldMap[docType];
  if (!field) return next(new AppError('Invalid document type.', 400));
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return next(new AppError('Invalid company id.', 400));

  const company = await Company.findById(id);
  if (!company) return next(new AppError('Company not found.', 404));

  const rawValue = company[field];
  if (!rawValue || typeof rawValue !== 'string') {
    return next(new AppError('Document not found for this company.', 404));
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return next(new AppError('Storage is not configured.', 500));

  // Original filename (used for Content-Disposition / display). We never expose
  // the Cloudinary public id to the admin UI.
  const originalName = company[`${field}Name`];
  const extFromName = (originalName || '').split('.').pop()?.toLowerCase();
  const extFromUrl = (rawValue.split('?')[0].split('/').pop().split('.').pop() || '').toLowerCase();
  const ext = extFromName || extFromUrl || 'pdf';

  const mimeFromExt = {
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }[ext];

  // Build a list of server-side fetch sources. We prefer Cloudinary's signed
  // private-download URL so we bypass the account's "delivery of PDF files"
  // restriction that makes image-delivered PDFs return HTTP 401, and so the
  // browser never contacts Cloudinary directly. Only our own cloud is ever used.
  const sources = [];
  let publicId = null;
  let resourceTypeHint = null;

  if (/^https?:\/\//i.test(rawValue)) {
    if (!rawValue.includes(`res.cloudinary.com/${cloudName}`)) {
      return next(new AppError('Document source is not allowed.', 400));
    }
    const match = rawValue.split('?')[0].match(/\/(?:raw|image)\/upload\/(?:v\d+\/)?(.+)$/i);
    if (match) {
      publicId = decodeURIComponent(match[1]);
      resourceTypeHint = /\/raw\/upload\//i.test(rawValue) ? 'raw' : 'image';
    }
  } else {
    // Legacy bare public id.
    publicId = rawValue;
  }

  if (publicId) {
    const order = resourceTypeHint
      ? [resourceTypeHint, resourceTypeHint === 'raw' ? 'image' : 'raw']
      : ['raw', 'image'];
    for (const rt of order) {
      try {
        sources.push(
          cloudinary.utils.private_download_url(publicId, ext, { resource_type: rt, type: 'upload' })
        );
      } catch (_) { /* ignore */ }
    }
  }

  // Last-resort fallback for current raw delivery URLs (new uploads).
  if (/^https?:\/\//i.test(rawValue) && rawValue.includes('/raw/upload/')) {
    sources.unshift(rawValue);
  }

  if (!sources.length) {
    return next(new AppError('Document source could not be resolved.', 400));
  }

  let upstream = null;
  for (const src of sources) {
    try {
      const r = await fetch(src);
      if (r.ok && r.body) { upstream = r; break; }
    } catch (_) { /* try next source */ }
  }
  if (!upstream) {
    return next(new AppError('Failed to retrieve document from storage.', 502));
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (!buffer.length) return next(new AppError('Document is empty.', 404));

  let contentType = company[`${field}Mime`] || mimeFromExt || null;
  const head = buffer.subarray(0, 5).toString('latin1');
  if (!contentType || contentType === 'application/octet-stream') {
    if (head === '%PDF-') contentType = 'application/pdf';
    else if (upstream.headers.get('content-type')) contentType = upstream.headers.get('content-type');
    else contentType = mimeFromExt || 'application/octet-stream';
  }
  const isPdf = contentType === 'application/pdf' || head === '%PDF-';

  const dispositionName = (originalName || `${docType}.${ext}`).replace(/"/g, '');
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', `inline; filename="${dispositionName}"`);
  res.set('Content-Length', String(buffer.length));
  res.set('Cache-Control', 'private, max-age=300');
  res.set('X-Content-Type-Options', 'nosniff');
  return res.send(buffer);
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

// @desc    Resubmit a rejected company profile for admin review
// @route   PUT /api/companies/:id/resubmit
// @access  Private (Owner)
exports.resubmitCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.owner.toString() !== req.user.id) {
    return next(new AppError('Not authorized.', 403));
  }
  if (company.isApproved) {
    return next(new AppError('Company is already approved.', 400));
  }
  if (company.isActive !== false || !company.rejectionReason) {
    return next(new AppError('Only a rejected company can be resubmitted for review.', 400));
  }

  // Back to pending review — approval is still decided by an admin.
  company.isApproved = false;
  company.isActive = true;
  company.rejectionReason = '';
  company.reviewedBy = undefined;
  company.reviewedAt = undefined;
  await company.save({ validateBeforeSave: false });

  notifyAllAdmins({
    type: 'company_pending_approval',
    title: 'Company resubmitted for review',
    message: `${company.name} was updated and resubmitted for approval.`,
    link: '/admin/companies',
    data: { companyId: company._id },
    sender: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: 'Company resubmitted! Waiting for admin approval.',
    data: company,
  });
});

module.exports = exports;
