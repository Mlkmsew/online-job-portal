// ============================================
// Auth Controller
// ============================================
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { sendTokenResponse, generateAccessToken } = require('../utils/jwt');
const { sendEmail, emailTemplates } = require('../config/email');
const { asyncHandler } = require('../utils/helpers');
const { parseResumeSkills } = require('../utils/resumeParser');
const { AppError } = require('../middleware/errorHandler');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check existing
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('Email already registered. Please log in.', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'jobseeker',
  });
  // Generate numeric OTP for email verification
  const code = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // Send verification OTP email
  try {
    // Prefer a dedicated OTP template if available
    if (emailTemplates.verifyOTP) {
      const template = emailTemplates.verifyOTP(user.firstName, code);
      await sendEmail({ to: user.email, ...template });
    } else {
      await sendEmail({ to: user.email, subject: 'Your verification code', text: `Your verification code: ${code}` });
    }
  } catch (emailErr) {
    // Don't fail registration if email fails
    console.error('Email failed:', emailErr.message);
    // Development fallback: print OTP to server console
    try {
      console.log('🔔 Verification email failed to send. Development fallback:');
      console.log(`OTP code (DEV): ${code} for ${user.email}`);
    } catch (e) {
      // ignore logging errors
    }
  }

  sendTokenResponse(user, 201, res, 'Registration successful! Please check your email to verify your account.');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Get user with password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (user.isSuspended) {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  if (!user.isEmailVerified) {
    return next(new AppError('Please verify your email before logging in.', 403));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful!');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  // Optionally revoke refresh token if provided
  const { refreshToken } = req.body || {};
  try {
    if (req.user && refreshToken) {
      const user = await User.findById(req.user.id);
      if (user && typeof user.removeRefreshToken === 'function') {
        user.removeRefreshToken(refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    }
  } catch (err) {
    // ignore
  }

  res
    .cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })
    .status(200)
    .json({ success: true, message: 'Logged out successfully.' });
});

// @desc    Verify OTP (numeric) for email verification
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;
  if (!email || !code) return next(new AppError('Email and code are required.', 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError('Invalid code or email.', 400));

  const ok = user.verifyOTP(code);
  if (!ok) return next(new AppError('Invalid or expired OTP.', 400));

  user.isEmailVerified = true;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully.' });
});

// @desc    Send OTP to email (for verification)
// @route   POST /api/auth/send-otp
// @access  Public (or protected if no email provided)
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  let user;

  if (email) {
    user = await User.findOne({ email });
    if (!user) return next(new AppError('Email not found.', 404));
  } else if (req.user) {
    user = await User.findById(req.user.id);
  } else {
    return next(new AppError('Email is required.', 400));
  }

  const code = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({ to: user.email, subject: 'Your verification code', text: `Your verification code: ${code}` });
  } catch (err) {
    console.error('OTP email failed:', err.message);
    // Development fallback: print OTP to server console and return success in dev
    try {
      console.log('🔔 OTP email failed to send. Development fallback:');
      console.log(`OTP code (DEV): ${code} for ${user.email}`);
    } catch (e) {
      // ignore
    }

    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({ success: true, message: 'OTP printed to server console (development).' });
    }

    return next(new AppError('Could not send OTP email.', 500));
  }

  res.status(200).json({ success: true, message: 'OTP sent to email.' });
});

// @desc    Request email change (sends OTP to new email)
// @route   POST /api/auth/request-email-change
// @access  Private
exports.requestEmailChange = asyncHandler(async (req, res, next) => {
  const { newEmail } = req.body;
  if (!newEmail) return next(new AppError('New email is required.', 400));

  const existing = await User.findOne({ email: newEmail });
  if (existing) return next(new AppError('That email is already in use.', 400));

  const user = await User.findById(req.user.id);
  const code = user.generateOTP();
  user.pendingEmail = newEmail;
  user.pendingEmailOTP = crypto.createHash('sha256').update(code).digest('hex');
  user.pendingEmailExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // Send OTP to new email
  try {
    await sendEmail({ to: newEmail, subject: 'Confirm your new email', text: `Your confirmation code: ${code}` });
  } catch (err) {
    return next(new AppError('Could not send confirmation email.', 500));
  }

  res.status(200).json({ success: true, message: 'Confirmation code sent to new email.' });
});

// @desc    Confirm email change with OTP
// @route   POST /api/auth/confirm-email-change
// @access  Private
exports.confirmEmailChange = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  if (!code) return next(new AppError('Code is required.', 400));

  const user = await User.findById(req.user.id);
  if (!user || !user.pendingEmail || !user.pendingEmailOTP || !user.pendingEmailExpire) {
    return next(new AppError('No pending email change found.', 400));
  }

  if (Date.now() > user.pendingEmailExpire) return next(new AppError('Confirmation code expired.', 400));

  const hashed = crypto.createHash('sha256').update(code).digest('hex');
  if (hashed !== user.pendingEmailOTP) return next(new AppError('Invalid confirmation code.', 400));

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.pendingEmailOTP = undefined;
  user.pendingEmailExpire = undefined;
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email changed and verified.' });
});

// @desc    Social login (Google)
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
  // Placeholder: expects { idToken } from client
  const { idToken } = req.body;
  if (!idToken) return next(new AppError('idToken required.', 400));

  // Real implementation: verify idToken with Google and extract email, name, sub (googleId)
  // For now, return 501 Not Implemented
  return next(new AppError('Google login not yet implemented. Please use email login.', 501));
});

// @desc    Social login (GitHub)
// @route   POST /api/auth/github
// @access  Public
exports.githubLogin = asyncHandler(async (req, res, next) => {
  // Placeholder: expects { code } from OAuth flow
  return next(new AppError('GitHub login not yet implemented. Please use email login.', 501));
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('skills', 'name slug')
    .select('-password -resetPasswordToken -emailVerificationToken');

  res.status(200).json({ success: true, data: user });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification link.', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully! You can now access all features.' });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
exports.resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified.', 400));
  }

  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  const template = emailTemplates.verifyEmail(user.firstName, verifyUrl);
  try {
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    console.error('Resend verification email failed:', err.message);
    console.log('Verification link (DEV):', verifyUrl);
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({ success: true, message: 'Verification link printed to server console (development).' });
    }
    return next(new AppError('Could not send verification email.', 500));
  }

  res.status(200).json({ success: true, message: 'Verification email sent. Please check your inbox.' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, we sent a password reset link.',
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    const template = emailTemplates.resetPassword(user.firstName, resetUrl);
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent. Please try again.', 500));
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, we sent a password reset link.',
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset link.', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful!');
});

// @desc    Update password (logged in user)
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully!');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new AppError('Refresh token required.', 401));

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User not found.', 401));

    const newAccessToken = generateAccessToken(user._id);
    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch {
    return next(new AppError('Invalid refresh token.', 401));
  }
});

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'headline', 'bio', 'dateOfBirth',
    'gender', 'location', 'skills', 'languages', 'education', 'experience',
    'portfolio', 'socialLinks', 'jobPreferences',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).populate('skills', 'name slug');

  // Recalculate completeness
  user.calculateProfileCompleteness();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: user });
});

// @desc    Upload avatar
// @route   PUT /api/auth/upload-avatar
// @access  Private
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image.', 400));

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: req.file.path, avatarPublicId: req.file.filename },
    { new: true }
  );

  res.status(200).json({ success: true, message: 'Avatar updated.', avatar: user.avatar });
});

// @desc    Upload CV
// @route   PUT /api/auth/upload-cv
// @access  Private
exports.uploadCV = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a CV file.', 400));

  let user = await User.findByIdAndUpdate(
    req.user.id,
    {
      cv: req.file.path,
      cvPublicId: req.file.filename,
      cvOriginalName: req.file.originalname,
    },
    { new: true }
  );

  try {
    const { skills: extractedSkills } = await parseResumeSkills(user.cv);
    if (extractedSkills && extractedSkills.length) {
      const existingSkillIds = (user.skills || []).map((id) => id.toString());
      const resumeSkillIds = extractedSkills.map((skill) => skill._id.toString());
      const combinedSkillIds = Array.from(new Set([...existingSkillIds, ...resumeSkillIds]));
      user.skills = combinedSkillIds;
      await user.save();
    }
  } catch (error) {
    console.error('Resume parsing failed:', error.message);
  }

  res.status(200).json({ success: true, message: 'CV uploaded successfully.', cv: user.cv });
});

// @desc    Upload certificate
// @route   POST /api/auth/upload-certificate
// @access  Private
exports.uploadCertificate = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a certificate.', 400));

  const { name, issuer, issueDate } = req.body;
  const cert = { name, url: req.file.path, publicId: req.file.filename, issuer, issueDate };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { certificates: cert } },
    { new: true }
  );

  res.status(200).json({ success: true, message: 'Certificate uploaded.', data: user.certificates });
});
