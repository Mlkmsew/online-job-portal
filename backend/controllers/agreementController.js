const Agreement = require('../models/Agreement');
const User = require('../models/user');
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// ============================================
// ADMIN ENDPOINTS (Protected, Admin only)
// ============================================

// @desc    Get all agreements with pagination
// @route   GET /api/agreements
// @access  Private (Admin)
exports.getAgreements = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        query.$or = [{ title: regex }, { description: regex }];
    }

    const [agreements, total] = await Promise.all([
        Agreement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Agreement.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        count: agreements.length,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
        data: agreements,
    });
});

// @desc    Get single agreement by ID
// @route   GET /api/agreements/:id
// @access  Private (Admin)
exports.getAgreementById = asyncHandler(async (req, res, next) => {
    const agreement = await Agreement.findById(req.params.id).lean();
    if (!agreement) {
        return next(new AppError('Agreement not found.', 404));
    }
    res.status(200).json({ success: true, data: agreement });
});

// @desc    Create new agreement
// @route   POST /api/agreements
// @access  Private (Admin)
exports.createAgreement = asyncHandler(async (req, res, next) => {
    const { type, title, description, content, status } = req.body;

    if (!type || !title || !description || !content) {
        return next(new AppError('All fields are required: type, title, description, content.', 400));
    }

    if (!['terms', 'privacy'].includes(type)) {
        return next(new AppError('Invalid agreement type. Must be "terms" or "privacy".', 400));
    }

    // Check if there's already an active agreement of this type
    if (status === 'active') {
        const existingActive = await Agreement.findOne({ type, status: 'active' });
        if (existingActive) {
            return next(new AppError(`An active ${type} agreement already exists. Please deactivate it first or set status to inactive.`, 409));
        }
    }

    const agreement = await Agreement.create({
        type,
        title,
        description,
        content,
        status: status || 'inactive',
        version: 1,
    });

    res.status(201).json({ success: true, message: 'Agreement created successfully.', data: agreement });
});

// @desc    Update agreement
// @route   PUT /api/agreements/:id
// @access  Private (Admin)
exports.updateAgreement = asyncHandler(async (req, res, next) => {
    const { type, title, description, content, status } = req.body;

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
        return next(new AppError('Agreement not found.', 404));
    }

    // Validate type if provided
    if (type && !['terms', 'privacy'].includes(type)) {
        return next(new AppError('Invalid agreement type. Must be "terms" or "privacy".', 400));
    }

    // Check for duplicate active agreement if status is being changed to active
    const newType = type || agreement.type;
    const newStatus = status !== undefined ? status : agreement.status;

    if (newStatus === 'active' && agreement.status !== 'active') {
        const existingActive = await Agreement.findOne({ type: newType, status: 'active', _id: { $ne: agreement._id } });
        if (existingActive) {
            return next(new AppError(`An active ${newType} agreement already exists. Please deactivate it first.`, 409));
        }
    }

    // Update fields
    if (type) agreement.type = type;
    if (title) agreement.title = title;
    if (description) agreement.description = description;
    if (content) agreement.content = content;
    if (status !== undefined) agreement.status = status;

    // Increment version if content changed
    if (content && content !== agreement.content) {
        agreement.version += 1;
    }

    await agreement.save();

    res.status(200).json({ success: true, message: 'Agreement updated successfully.', data: agreement });
});

// @desc    Delete agreement
// @route   DELETE /api/agreements/:id
// @access  Private (Admin)
exports.deleteAgreement = asyncHandler(async (req, res, next) => {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
        return next(new AppError('Agreement not found.', 404));
    }

    await agreement.deleteOne();
    res.status(200).json({ success: true, message: 'Agreement deleted successfully.' });
});

// @desc    Update agreement status (activate/deactivate)
// @route   PATCH /api/agreements/:id/status
// @access  Private (Admin)
exports.updateAgreementStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
        return next(new AppError('Invalid status. Must be "active" or "inactive".', 400));
    }

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
        return next(new AppError('Agreement not found.', 404));
    }

    if (status === 'active') {
        const existingActive = await Agreement.findOne({ type: agreement.type, status: 'active', _id: { $ne: agreement._id } });
        if (existingActive) {
            return next(new AppError(`An active ${agreement.type} agreement already exists. Please deactivate it first.`, 409));
        }
    }

    agreement.status = status;
    await agreement.save();

    res.status(200).json({ success: true, message: `Agreement ${status === 'active' ? 'activated' : 'deactivated'} successfully.`, data: agreement });
});

// ============================================
// PUBLIC / EMPLOYER ENDPOINTS
// ============================================

// @desc    Get active agreements (Terms of Service & Privacy Policy)
// @route   GET /api/agreements/active
// @access  Public (or Authenticated Employer)
exports.getActiveAgreements = asyncHandler(async (req, res) => {
    const agreements = await Agreement.getActiveAgreements();
    res.status(200).json({ success: true, data: agreements });
});

// @desc    Get active agreement by type
// @route   GET /api/agreements/active/:type
// @access  Public (or Authenticated Employer)
exports.getActiveAgreementByType = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    if (!['terms', 'privacy'].includes(type)) {
        return next(new AppError('Invalid agreement type.', 400));
    }
    const agreement = await Agreement.getActiveByType(type);
    if (!agreement) {
        return next(new AppError(`No active ${type} agreement found.`, 404));
    }
    res.status(200).json({ success: true, data: agreement });
});

// @desc    Accept agreement (Employer)
// @route   POST /api/agreements/accept
// @access  Private (Employer)
exports.acceptAgreement = asyncHandler(async (req, res, next) => {
    const { agreementId, type } = req.body;
    const userId = req.user.id || req.user._id;

    if (!agreementId || !type) {
        return next(new AppError('Agreement ID and type are required.', 400));
    }

    if (!['terms', 'privacy'].includes(type)) {
        return next(new AppError('Invalid agreement type.', 400));
    }

    const agreement = await Agreement.findById(agreementId);
    if (!agreement) {
        return next(new AppError('Agreement not found.', 404));
    }

    if (agreement.type !== type) {
        return next(new AppError('Agreement type mismatch.', 400));
    }

    if (agreement.status !== 'active') {
        return next(new AppError('This agreement is not currently active.', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    // Initialize acceptedAgreements array if not exists
    if (!user.acceptedAgreements) {
        user.acceptedAgreements = [];
    }

    // Check if already accepted this version
    const existingAcceptance = user.acceptedAgreements.find(
        (a) => a.agreementId.toString() === agreementId && a.type === type
    );

    if (existingAcceptance) {
        // Update to latest version/acceptance time
        existingAcceptance.acceptedAt = new Date();
        existingAcceptance.version = agreement.version;
    } else {
        user.acceptedAgreements.push({
            agreementId,
            type,
            version: agreement.version,
            acceptedAt: new Date(),
        });
    }

    // Also maintain legacy boolean fields for backward compatibility
    if (type === 'terms') {
        user.termsAccepted = true;
        user.termsAcceptedAt = new Date();
    } else if (type === 'privacy') {
        user.privacyAccepted = true;
        user.privacyAcceptedAt = new Date();
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: `${type === 'terms' ? 'Terms of Service' : 'Privacy Policy'} accepted successfully.`,
        data: {
            acceptedAgreements: user.acceptedAgreements,
            termsAccepted: user.termsAccepted,
            privacyAccepted: user.privacyAccepted,
        },
    });
});

// @desc    Get user's accepted agreements
// @route   GET /api/agreements/accepted
// @access  Private (Employer)
exports.getAcceptedAgreements = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('acceptedAgreements termsAccepted privacyAccepted termsAcceptedAt privacyAcceptedAt').lean();

    if (!user) {
        return res.status(200).json({ success: true, data: { acceptedAgreements: [], termsAccepted: false, privacyAccepted: false } });
    }

    res.status(200).json({
        success: true,
        data: {
            acceptedAgreements: user.acceptedAgreements || [],
            termsAccepted: user.termsAccepted || false,
            privacyAccepted: user.privacyAccepted || false,
            termsAcceptedAt: user.termsAcceptedAt || null,
            privacyAcceptedAt: user.privacyAcceptedAt || null,
        },
    });
});