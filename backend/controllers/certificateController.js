// ============================================
// Certificate Verification Controller
// Job seeker: upload & verify certificates, view own history.
// Admin: review verification records, mark as verified/suspicious,
//        request review, reject, suspend fraudulent accounts.
// ============================================
const VerifiedCertificate = require('../models/VerifiedCertificate');
const CertificateVerification = require('../models/CertificateVerification');
const User = require('../models/user');
const { asyncHandler, paginate, escapeRegex, notifyAllAdmins, createNotification } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { analyzeCertificateBuffer } = require('../utils/certificateParser');
const { runVerification, IMPORTANT_FIELDS } = require('../utils/certificateVerification');

const ALLOWED_CERT_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

// Clean a plain-text value from the multipart body
const cleanStr = (value) => (typeof value === 'string' ? value.trim() : '');

const declaredFromBody = (body = {}) => ({
  fullName: cleanStr(body.fullName),
  studentId: cleanStr(body.studentId),
  certificateNumber: cleanStr(body.certificateNumber),
  institution: cleanStr(body.institution),
  program: cleanStr(body.program),
  certificateType: cleanStr(body.certificateType),
  issueDate: cleanStr(body.issueDate),
  graduationYear: cleanStr(body.graduationYear),
  email: cleanStr(body.email),
  phone: cleanStr(body.phone),
});

const downloadFile = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download uploaded certificate: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

// Safely serialize a verification record for job seekers
// (never expose the full trusted database to applicants)
const serializeForSeeker = (doc) => ({
  _id: doc._id,
  verificationNumber: doc.verificationNumber,
  verificationStatus: doc.verificationStatus,
  qrScanResult: doc.qrScanResult,
  mismatchedFields: doc.mismatchedFields || [],
  profileMismatchedFields: doc.profileMismatchedFields || [],
  verificationScore: doc.verificationScore || 0,
  reason: doc.reason,
  isDuplicate: doc.isDuplicate,
  uploadedDocument: doc.uploadedDocument,
  uploadedData: doc.uploadedData,
  profileData: doc.profileData,
  reviewStatus: doc.reviewStatus,
  createdAt: doc.createdAt,
});

// @desc    Upload a certificate and run the full verification workflow
// @route   POST /api/certificates/verify
// @access  Private (Job Seeker)
exports.uploadAndVerify = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a certificate file.', 400));

  // Security: validate MIME type (Cloudinary reports real content type)
  const mime = req.file.mimetype || '';
  if (!ALLOWED_CERT_MIME.includes(mime)) {
    return next(new AppError('Unsupported certificate file type. Allowed: PDF, JPG, PNG.', 400));
  }

  const applicant = req.user;
  const declared = declaredFromBody(req.body);

  let analyzed;
  try {
    const buffer = await downloadFile(req.file.path);
    analyzed = await analyzeCertificateBuffer(buffer);
  } catch (err) {
    // Malformed / unreadable file → reject the upload outright
    return next(new AppError(err.message || 'Certificate file could not be read.', 400));
  }

  const result = await runVerification({
    applicant,
    extracted: analyzed.fields,
    declared,
    qrScanResult: analyzed.qrScanResult,
    verificationNumber: analyzed.verificationNumber || declared.certificateNumber,
  });

  const verification = await CertificateVerification.create({
    user: applicant._id,
    certificate: result.certificateId || null,
    uploadedDocument: {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      mimeType: mime,
      fileSize: req.file.size || 0,
    },
    verificationNumber: result.verificationNumber,
    qrScanResult: {
      status: analyzed.qrScanResult.status,
      raw: analyzed.qrScanResult.raw || '',
      message: analyzed.qrScanResult.message || '',
    },
    extractedData: result.extractedData,
    declaredData: result.declaredData,
    uploadedData: result.uploadedData,
    trustedRecord: result.trustedRecord,
    profileData: result.profileData,
    profileMismatchedFields: result.profileMismatchedFields || [],
    verificationScore: result.verificationScore || 0,
    verificationStatus: result.verificationStatus,
    mismatchedFields: result.mismatchedFields,
    reason: result.reason,
    isDuplicate: result.isDuplicate,
    duplicateOfUser: result.duplicateOfUser,
    verifiedAt: result.verificationStatus === 'VERIFIED' ? new Date() : undefined,
  });

  // Notify the applicant of the result (no sensitive DB internals)
  const messageMap = {
    VERIFIED: 'Your certificate has been successfully verified.',
    SUSPICIOUS: 'Your certificate needs additional review. Please check the result details.',
    INVALID: 'Your certificate could not be verified. Please contact support if this is an error.',
    PENDING_REVIEW: 'Your certificate is pending manual review.',
  };
  try {
    await createNotification({
      recipient: applicant._id,
      type: 'certificate_verification',
      title: 'Certificate verification update',
      message: messageMap[result.verificationStatus] || 'Certificate verification completed.',
      link: '/dashboard/certificates',
      data: { verificationId: verification._id, status: result.verificationStatus },
      sender: applicant._id,
    });
  } catch (err) {
    console.error('Certificate notification error:', err.message);
  }

  // Flag non-clean results for admin review
  if (result.verificationStatus !== 'VERIFIED') {
    try {
      await notifyAllAdmins({
        type: 'certificate_requires_review',
        title: 'Certificate requires review',
        message: `${applicant.firstName} ${applicant.lastName} submitted a certificate with status ${result.verificationStatus}.`,
        link: '/admin/certificates',
        data: { verificationId: verification._id, status: result.verificationStatus },
        sender: applicant._id,
      });
    } catch (err) {
      console.error('Certificate admin notify error:', err.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Certificate processed.',
    data: serializeForSeeker(verification),
  });
});

// @desc    Get the current user's verification history
// @route   GET /api/certificates/my
// @access  Private (Job Seeker)
exports.getMyVerifications = asyncHandler(async (req, res) => {
  const { results, pagination } = await paginate(
    CertificateVerification,
    { user: req.user._id },
    req.query,
    [],
    '-createdAt'
  );
  res.status(200).json({
    success: true,
    count: results.length,
    pagination,
    data: results.map(serializeForSeeker),
  });
});

// @desc    Get a single verification owned by the current user
// @route   GET /api/certificates/my/:id
// @access  Private (Job Seeker)
exports.getMyVerification = asyncHandler(async (req, res, next) => {
  const verification = await CertificateVerification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!verification) return next(new AppError('Verification record not found.', 404));
  res.status(200).json({ success: true, data: serializeForSeeker(verification) });
});

// @desc    Public-ish status lookup by verification number
//          Returns only the status, never the trusted database contents.
// @route   POST /api/certificates/check
// @access  Private (any authenticated role)
exports.checkByNumber = asyncHandler(async (req, res, next) => {
  const { verificationNumber } = req.body;
  if (!verificationNumber) return next(new AppError('Verification number is required.', 400));
  const normalized = String(verificationNumber).trim().toUpperCase();

  const record = await VerifiedCertificate.findOne({
    $or: [{ verificationCode: normalized }, { certificateNumber: normalized }],
  }).lean();

  if (!record) {
    return res.status(200).json({ success: true, data: { verificationNumber: normalized, verificationStatus: 'INVALID' } });
  }

  res.status(200).json({
    success: true,
    data: {
      verificationNumber: normalized,
      verificationStatus: 'VERIFIED',
      fullName: record.fullName,
      institution: record.institution,
      certificateType: record.certificateType,
      graduationYear: record.graduationYear,
    },
  });
});

// ============================================================
// Admin endpoints
// ============================================================

// @desc    List all verification records (admin)
// @route   GET /api/admin/certificates
// @access  Private (Admin)
exports.getAllVerifications = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.status && req.query.status !== 'all') {
    query.verificationStatus = req.query.status;
  }
  if (req.query.review && req.query.review !== 'all') {
    query.reviewStatus = req.query.review;
  }
  if (req.query.duplicate === 'true') {
    query.isDuplicate = true;
  }

  if (req.query.search) {
    const safe = escapeRegex(req.query.search);
    const matchedUsers = await User.find({
      $or: [{ firstName: new RegExp(safe, 'i') }, { lastName: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }],
    })
      .select('_id')
      .lean();
    const or = [{ verificationNumber: new RegExp(safe, 'i') }];
    if (matchedUsers.length) or.push({ user: { $in: matchedUsers.map((u) => u._id) } });
    query.$or = or;
  }

  const { results, pagination } = await paginate(
    CertificateVerification,
    query,
    req.query,
    [{ path: 'user', select: 'firstName lastName email phone' }, { path: 'reviewedBy', select: 'firstName lastName email' }],
    '-createdAt'
  );

  const stats = await CertificateVerification.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
  ]);
  const statusCounts = { VERIFIED: 0, SUSPICIOUS: 0, INVALID: 0, PENDING_REVIEW: 0 };
  stats.forEach(({ _id, count }) => {
    if (statusCounts[_id] !== undefined) statusCounts[_id] = count;
  });
  const pendingReviews = await CertificateVerification.countDocuments({ reviewStatus: 'pending' });
  const duplicates = await CertificateVerification.countDocuments({ isDuplicate: true });

  res.status(200).json({
    success: true,
    count: results.length,
    pagination,
    stats: { ...statusCounts, total: results.length, pendingReviews, duplicates },
    data: results,
  });
});

// @desc    Get one verification record with full details (admin)
// @route   GET /api/admin/certificates/:id
// @access  Private (Admin)
exports.getVerification = asyncHandler(async (req, res, next) => {
  const verification = await CertificateVerification.findById(req.params.id)
    .populate('user', 'firstName lastName email phone avatar')
    .populate('reviewedBy', 'firstName lastName email');
  if (!verification) return next(new AppError('Verification record not found.', 404));
  res.status(200).json({ success: true, data: verification });
});

// @desc    Review a verification record (admin action)
// @route   PUT /api/admin/certificates/:id/review
// @access  Private (Admin)
exports.reviewVerification = asyncHandler(async (req, res, next) => {
  const verification = await CertificateVerification.findById(req.params.id);
  if (!verification) return next(new AppError('Verification record not found.', 404));

  const { action, notes } = req.body;
  const validActions = ['verified', 'rejected', 'suspicious', 'request_review', 'pending'];
  if (!validActions.includes(action)) {
    return next(new AppError(`Invalid review action. Use one of: ${validActions.join(', ')}.`, 400));
  }

  const actionMap = {
    verified: { reviewStatus: 'verified', verificationStatus: 'VERIFIED' },
    rejected: { reviewStatus: 'rejected', verificationStatus: 'INVALID' },
    suspicious: { reviewStatus: 'marked_suspicious', verificationStatus: 'SUSPICIOUS' },
    request_review: { reviewStatus: 'pending', verificationStatus: 'PENDING_REVIEW' },
    pending: { reviewStatus: 'pending', verificationStatus: 'PENDING_REVIEW' },
  };

  const nextState = actionMap[action];
  verification.reviewStatus = nextState.reviewStatus;
  verification.verificationStatus = nextState.verificationStatus;
  verification.reviewedBy = req.user._id;
  verification.reviewNotes = cleanStr(notes);
  verification.reviewedAt = new Date();
  if (nextState.verificationStatus === 'VERIFIED') verification.verifiedAt = new Date();

  await verification.save({ validateBeforeSave: false });

  // Notify the applicant of the admin decision
  try {
    const statusMessage = {
      VERIFIED: 'Your certificate has been verified by our team.',
      SUSPICIOUS: 'Your certificate has been flagged as suspicious by our team.',
      INVALID: 'Your certificate was rejected during manual review.',
      PENDING_REVIEW: 'Your certificate has been moved back to pending review.',
    };
    await createNotification({
      recipient: verification.user,
      type: 'certificate_review',
      title: 'Certificate review update',
      message: statusMessage[verification.verificationStatus] || 'Your certificate review status changed.',
      link: '/dashboard/certificates',
      data: { verificationId: verification._id, status: verification.verificationStatus },
      sender: req.user._id,
    });
  } catch (err) {
    console.error('Certificate review notification error:', err.message);
  }

  res.status(200).json({ success: true, message: 'Review saved.', data: verification });
});

// @desc    Suspend the account that submitted a fraudulent certificate
// @route   PUT /api/admin/certificates/:id/suspend-user
// @access  Private (Admin)
exports.suspendUserForFraud = asyncHandler(async (req, res, next) => {
  const verification = await CertificateVerification.findById(req.params.id);
  if (!verification) return next(new AppError('Verification record not found.', 404));

  const user = await User.findById(verification.user);
  if (!user) return next(new AppError('Applicant user not found.', 404));
  if (user.role === 'admin') return next(new AppError('Admin accounts cannot be suspended.', 400));

  user.isSuspended = true;
  user.status = 'suspended';
  user.isActive = true;
  await user.save({ validateBeforeSave: false });

  verification.reviewStatus = 'marked_suspicious';
  verification.reviewNotes = [verification.reviewNotes, 'Account suspended for certificate fraud.']
    .filter(Boolean)
    .join(' ');
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();
  await verification.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Applicant account suspended for certificate fraud.' });
});

module.exports = exports;
module.exports.IMPORTANT_FIELDS = IMPORTANT_FIELDS;