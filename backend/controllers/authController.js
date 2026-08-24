// ============================================
// Auth Controller
// ============================================
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');
const { sendTokenResponse, generateAccessToken } = require('../utils/jwt');
const { sendEmail, emailTemplates, getClientURL } = require('../config/email');
const { asyncHandler, notifyAllAdmins } = require('../utils/helpers');
const { parseResumeSkills } = require('../utils/resumeParser');
const { AppError } = require('../middleware/errorHandler');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Safe logging helpers — never print full emails, OTPs, passwords or secrets
const maskEmail = (value) => {
  if (!value || typeof value !== 'string') return '(not set)';
  const at = value.indexOf('@');
  if (at === -1) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, Math.min(2, at))}***@${value.slice(at + 1)}`;
};
const maskEmailsInText = (text) =>
  String(text || '').replace(/[\w.+-]+@[\w.-]+\.\w+/g, (match) => maskEmail(match));

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, password, role } = req.body;

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
    phone,
    password,
    role: role || 'jobseeker',
  });
  // Generate numeric OTP for email verification
  const code = user.generateOTP();
  console.log('[OTP] generated');
  await user.save({ validateBeforeSave: false });
  console.log('[OTP] saved');

  // Send verification OTP email
  let emailSent = true;
  try {
    // Prefer a dedicated OTP template if available
    console.log(`[EMAIL] called to=${maskEmail(user.email)}`);
    const mailOptions = emailTemplates.verifyOTP
      ? emailTemplates.verifyOTP(user.firstName, code)
      : { subject: 'Your verification code', text: `Your verification code: ${code}` };
    const info = await sendEmail({ to: user.email, ...mailOptions });
    console.log('[EMAIL] success');
    console.log(`[EMAIL] messageId=${info?.messageId || 'n/a'}`);
  } catch (emailErr) {
    // Registration itself must not fail when the SMTP server is unavailable —
    // the account exists and the user can request a new code via resend OTP.
    // The response carries `emailSent: false` so clients can warn the user.
    emailSent = false;
    console.error(
      `[EMAIL] failed code=${emailErr?.code || emailErr?.name || 'n/a'} message=${maskEmailsInText(emailErr?.message || String(emailErr))}`
    );
  }

  // Notify admins of a new registration (never blocks the signup flow)
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const isEmployer = user.role === 'employer';
  notifyAllAdmins({
    type: isEmployer ? 'new_employer_registration' : 'new_user_registration',
    title: isEmployer ? 'New employer registered' : 'New user registered',
    message: isEmployer
      ? `${displayName} (${user.email}) registered as an employer on the platform.`
      : `${displayName} (${user.email}) joined the platform as a job seeker.`,
    link: '/admin/users',
    data: { userId: user._id, role: user.role },
    sender: user._id,
  });

  console.log(`[REGISTER] completed emailSent=${emailSent}`);
  sendTokenResponse(
    user,
    201,
    res,
    emailSent
      ? 'Registration successful! Please check your email to verify your account.'
      : 'Registration successful, but the verification email could not be sent. Please use "Resend OTP" after logging in.',
    { emailSent }
  );
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

  if (user.isSuspended || user.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  if (user.status === 'rejected' || user.status === 'pending') {
    return next(
      new AppError(
        user.status === 'rejected'
          ? 'Your account was not approved. Please contact support for more information.'
          : 'Your account is awaiting approval. Please check back later.',
        403
      )
    );
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
  user.otpResendCount = 0;
  user.otpResendLockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully.' });
});

// @desc    Send / resend OTP to email (for verification)
// @route   POST /api/auth/send-otp
// @access  Public (or protected if no email provided)
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const rawEmail = req.body.email;
  let user;

  if (rawEmail) {
    // Normalize consistently so casing/whitespace variants cannot bypass limits
    user = await User.findOne({ email: String(rawEmail).trim().toLowerCase() });
    if (!user) return next(new AppError('Email not found.', 404));
  } else if (req.user) {
    user = await User.findById(req.user.id);
  } else {
    return next(new AppError('Email is required.', 400));
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified.', 400));
  }

  const maxAttempts = parseInt(process.env.OTP_RESEND_MAX_ATTEMPTS || '3', 10);
  const lockHours = parseInt(process.env.OTP_RESEND_LOCK_HOURS || '4', 10);
  const lockMs = lockHours * 60 * 60 * 1000;
  const now = Date.now();

  const sendBlockedResponse = (lockUntilDate, retryAfterSecondsOverride) => {
    const retryAfterSeconds =
      retryAfterSecondsOverride ??
      Math.max(1, Math.ceil((lockUntilDate.getTime() - Date.now()) / 1000));
    return res.status(429).json({
      success: false,
      message: 'Too many OTP resend attempts. Please try again later.',
      blocked: true,
      retryAfterSeconds,
      retryAfter: lockUntilDate.toISOString(),
    });
  };

  // Automatic unblock: an expired lock clears itself here and resets the
  // window — no admin action or cleanup job required.
  if (user.otpResendLockUntil && user.otpResendLockUntil.getTime() <= now) {
    const cleared = await User.updateOne(
      { _id: user._id, otpResendLockUntil: user.otpResendLockUntil },
      { $set: { otpResendCount: 0 }, $unset: { otpResendLockUntil: '', otpResendClaimId: '' } }
    );
    if (cleared.modifiedCount > 0) {
      user.otpResendCount = 0;
      user.otpResendLockUntil = undefined;
    }
  }

  // Server-side block enforcement (frontend state is never trusted)
  if (user.otpResendLockUntil && user.otpResendLockUntil.getTime() > now) {
    return sendBlockedResponse(user.otpResendLockUntil);
  }

  // Defensive self-heal for inconsistent legacy data (counter exhausted but
  // no lock recorded): start a fresh block window now instead of failing.
  if ((user.otpResendCount || 0) >= maxAttempts) {
    const lockUntilDate = new Date(now + lockMs);
    const locked = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [{ otpResendLockUntil: null }, { otpResendLockUntil: { $exists: false } }],
      },
      { $set: { otpResendLockUntil: lockUntilDate } }
    );
    if (locked) return sendBlockedResponse(lockUntilDate);
  }

  // Atomic claim of one resend slot BEFORE sending. The compound filter
  // guarantees two simultaneous requests can never both pass once the limit
  // or the lock is reached; losers match nothing and get a 429.
  const claimToken = crypto.randomBytes(16).toString('hex');
  const claimed = await User.findOneAndUpdate(
    {
      _id: user._id,
      $and: [
        { otpResendCount: { $lt: maxAttempts } },
        {
          $or: [
            { otpResendLockUntil: { $exists: false } },
            { otpResendLockUntil: null },
          ],
        },
      ],
    },
    { $inc: { otpResendCount: 1 }, $set: { otpResendClaimId: claimToken } },
    { new: true }
  );

  if (!claimed) {
    const fresh = await User.findById(user._id).select('otpResendLockUntil');
    return sendBlockedResponse(fresh?.otpResendLockUntil || new Date(now + lockMs));
  }
  user = claimed;

  // Persist the fresh OTP atomically before delivery
  const code = user.generateOTP();
  console.log('[OTP] regenerated for resend');
  await User.updateOne(
    { _id: user._id },
    { otpCode: user.otpCode, otpExpire: user.otpExpire }
  );

  try {
    const template = emailTemplates.verifyOTP
      ? emailTemplates.verifyOTP(user.firstName, code)
      : { subject: 'Your verification code', text: `Your verification code: ${code}` };
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    console.error(
      `[EMAIL] resend failed user=${user._id} code=${err?.code || err?.name || 'n/a'} ` +
      `message=${maskEmailsInText(err?.message || String(err))}`
    );
    // Failed delivery must not consume quota: roll back ONLY this attempt.
    // The claim-token guard keeps concurrent rollbacks from cancelling each
    // other's claims.
    await User.updateOne(
      { _id: user._id, otpResendClaimId: claimToken },
      { $inc: { otpResendCount: -1 }, $unset: { otpResendClaimId: '' } }
    );
    return next(new AppError('Could not send the verification email right now. Please try again shortly.', 502));
  }

  const remaining = Math.max(0, maxAttempts - (user.otpResendCount || 0));

  if (remaining === 0) {
    // The 3rd successful resend still delivers, then starts the block window
    const lockUntilDate = new Date(now + lockMs);
    await User.updateOne(
      { _id: user._id, otpResendCount: { $gte: maxAttempts } },
      { $set: { otpResendLockUntil: lockUntilDate } }
    );
    console.log(`[OTP] resend limit reached user=${user._id} blockedForHours=${lockHours}`);
    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent. This was your last resend attempt.',
      remainingResends: 0,
      blocked: true,
      retryAfterSeconds: Math.round(lockMs / 1000),
      retryAfter: lockUntilDate.toISOString(),
    });
  }

  res.status(200).json({
    success: true,
    message: 'A new verification code has been sent to your email.',
    remainingResends: remaining,
  });
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
  const { idToken } = req.body;
  if (!idToken) return next(new AppError('idToken required.', 400));
  if (!process.env.GOOGLE_CLIENT_ID) return next(new AppError('Google client ID is not configured.', 500));

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return next(new AppError('Invalid Google ID token.', 401));
  }

  const { email, sub: googleId, given_name, family_name, name } = payload || {};
  if (!email || !googleId) {
    return next(new AppError('Google account information is incomplete.', 400));
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user && user.googleId && user.googleId !== googleId) {
    return next(new AppError('A different Google account is already linked to this email.', 409));
  }

  if (!user) {
    const firstName = given_name || (name ? name.split(' ')[0] : 'Google');
    const lastName = family_name || (name ? name.split(' ').slice(1).join(' ') : 'User');
    const password = crypto.randomBytes(24).toString('hex');

    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      googleId,
      isEmailVerified: true,
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.isEmailVerified = true;
    if (!user.firstName) user.firstName = given_name || (name ? name.split(' ')[0] : user.firstName || 'Google');
    if (!user.lastName) user.lastName = family_name || (name ? name.split(' ').slice(1).join(' ') : user.lastName || 'User');
    await user.save({ validateBeforeSave: false });
  }

  if (user.isSuspended) {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  sendTokenResponse(user, 200, res, 'Google login successful!');
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
  const userId = req.user.id || req.user._id;
  const user = await User.findById(userId)
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

  // Use centralized getClientURL to ensure proper IP resolution for mobile devices
  const verifyUrl = `${getClientURL()}/verify-email/${verifyToken}`;
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
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, we sent a verification code.',
    });
  }

  const code = user.generateOTP();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });

  try {
    const template = emailTemplates.verifyOTP(user.firstName, code);
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent. Please try again.', 500));
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, we sent a verification code.',
  });
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPasswordWithOTP = asyncHandler(async (req, res, next) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return next(new AppError('Email, code, and password are required.', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Invalid code or email.', 400));
  }

  const isValidCode = user.verifyOTP(code);
  if (!isValidCode) {
    return next(new AppError('Invalid or expired verification code.', 400));
  }

  user.password = password;
  user.otpCode = undefined;
  user.otpExpire = undefined;
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
    'firstName', 'lastName', 'phone', 'headline', 'currentRole', 'bio', 'dateOfBirth',
    'gender', 'location', 'skills', 'skillNames', 'technicalSkills', 'softSkills', 'languages', 'education', 'educationDetails', 'experience', 'experienceDetails',
    'experienceYears', 'salaryExpectation', 'availability', 'portfolio', 'socialLinks', 'jobPreferences',
    'certificates', 'avatar', 'avatarPublicId',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // If avatar is being set to empty string, delete the field from DB entirely
  let unsetFields = {};
  if (updates.avatar === '' || updates.avatar === null) {
    delete updates.avatar;
    delete updates.avatarPublicId;
    unsetFields.avatar = '';
    unsetFields.avatarPublicId = '';
  }

  const userId = req.user.id || req.user._id;

  // Keep the combined skillNames in sync with the categorized skills so the
  // rest of the app (job matching, resume builder, CV parsing, completeness)
  // keeps seeing every skill while technical and soft stay separate.
  if (updates.technicalSkills !== undefined || updates.softSkills !== undefined) {
    const existing = await User.findById(userId);
    const technical = updates.technicalSkills !== undefined ? updates.technicalSkills : (existing?.technicalSkills || []);
    const soft = updates.softSkills !== undefined ? updates.softSkills : (existing?.softSkills || []);
    updates.skillNames = Array.from(
      new Set([...(Array.isArray(technical) ? technical : []), ...(Array.isArray(soft) ? soft : [])]
        .map((s) => String(s).trim())
        .filter(Boolean))
    );
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates, ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}) },
    { new: true, runValidators: true }
  ).populate('skills', 'name slug');

  // Recalculate completeness
  user.calculateProfileCompleteness();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: user });
});

// @desc    Update user settings preferences
// @route   PUT /api/auth/update-settings
// @access  Private
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { settings } = req.body || {};
  if (!settings || typeof settings !== 'object') {
    return next(new AppError('Settings payload is required.', 400));
  }

  const user = await User.findById(req.user.id || req.user._id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const currentSettings = user.settings || {};
  const currentNotifications = currentSettings.notifications || {};

  if (settings.notifications && typeof settings.notifications === 'object') {
    const inputNotifs = settings.notifications;

    const email_alerts = inputNotifs.email_alerts !== undefined ? Boolean(inputNotifs.email_alerts) : inputNotifs.email !== undefined ? Boolean(inputNotifs.email) : currentNotifications.email_alerts ?? currentNotifications.email ?? true;
    const in_app_notifications = inputNotifs.in_app_notifications !== undefined ? Boolean(inputNotifs.in_app_notifications) : inputNotifs.inapp !== undefined ? Boolean(inputNotifs.inapp) : currentNotifications.in_app_notifications ?? currentNotifications.inapp ?? true;
    const job_match_alerts = inputNotifs.job_match_alerts !== undefined ? Boolean(inputNotifs.job_match_alerts) : inputNotifs.match !== undefined ? Boolean(inputNotifs.match) : currentNotifications.job_match_alerts ?? currentNotifications.match ?? true;
    const application_status = inputNotifs.application_status !== undefined ? Boolean(inputNotifs.application_status) : inputNotifs.application !== undefined ? Boolean(inputNotifs.application) : currentNotifications.application_status ?? currentNotifications.application ?? true;
    const interview_reminders = inputNotifs.interview_reminders !== undefined ? Boolean(inputNotifs.interview_reminders) : inputNotifs.interview !== undefined ? Boolean(inputNotifs.interview) : currentNotifications.interview_reminders ?? currentNotifications.interview ?? true;

    settings.notifications = {
      ...currentNotifications,
      ...inputNotifs,
      email_alerts,
      email: email_alerts,
      in_app_notifications,
      inapp: in_app_notifications,
      job_match_alerts,
      match: job_match_alerts,
      application_status,
      application: application_status,
      interview_reminders,
      interview: interview_reminders,
    };
  }

  user.settings = {
    ...currentSettings,
    ...settings,
  };

  user.markModified('settings');
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully.',
    data: user.settings,
  });
});

// @desc    Deactivate current account
// @route   PUT /api/auth/deactivate-account
// @access  Private
exports.deactivateAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found.', 404));

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Account deactivated successfully.' });
});

// @desc    Delete current account
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found.', 404));

  if (user.role === 'employer') {
    const Company = require('../models/Company');
    await Company.updateMany({ owner: user._id }, { isActive: false });
  }

  await user.deleteOne();

  res.status(200).json({ success: true, message: 'Account deleted permanently.' });
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

  if (user) {
    user.calculateProfileCompleteness();
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message: 'Avatar updated.', avatar: user.avatar, data: user });
});

// @desc    Delete avatar
// @route   DELETE /api/auth/upload-avatar
// @access  Private
exports.deleteAvatar = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const existingUser = await User.findById(userId);
  if (!existingUser) return next(new AppError('User not found.', 404));

  // Delete from Cloudinary if public ID exists
  if (existingUser.avatarPublicId) {
    try {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(existingUser.avatarPublicId);
    } catch (err) {
      console.warn('Cloudinary avatar deletion failed (non-fatal):', err.message);
    }
  }

  // Remove avatar fields from DB
  const user = await User.findByIdAndUpdate(
    userId,
    { $unset: { avatar: '', avatarPublicId: '' } },
    { new: true }
  ).populate('skills', 'name slug');

  user.calculateProfileCompleteness();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Profile photo removed.', data: user });
});

// @desc    Upload CV
// @route   PUT /api/auth/upload-cv
// @access  Private
exports.uploadCV = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a CV file.', 400));

  const userId = req.user.id || req.user._id;
  let user = await User.findById(userId);
  if (!user) return next(new AppError('User not found.', 404));

  user.cv = req.file.path;
  user.cvPublicId = req.file.filename;
  user.cvOriginalName = req.file.originalname;
  // A fresh upload clears the detach lock so recommendations work again,
  // bumps the CV version and INVALIDATES any previous CV's parsed data
  // BEFORE parsing, so stale analysis can never be served while parsing or
  // after a parse failure.
  user.cvDetachedAt = null;
  user.cvVersion = (user.cvVersion || 0) + 1;
  user.resumeAnalysis = undefined;

  try {
    const analysis = await parseResumeSkills(user.cv);
    const extractedSkills = analysis.skills || [];
    const existingSkillIds = (user.skills || []).map((id) => id.toString());
    const resumeSkillIds = extractedSkills.map((skill) => skill._id.toString());
    const combinedSkillIds = Array.from(new Set([...existingSkillIds, ...resumeSkillIds]));

    user.skills = combinedSkillIds;
    // Fresh analysis bound to THIS file's identity (Cloudinary public id).
    user.resumeAnalysis = {
      cvId: req.file.filename,
      skillNames: extractedSkills.map((s) => s?.name).filter(Boolean),
      professionalTitle: analysis.professionalTitle || undefined,
      skills: extractedSkills,
      experienceYears: analysis.experienceYears,
      education: analysis.education,
      certifications: analysis.certifications,
      location: analysis.location,
      rawText: analysis.text,
    };

    // Auto-populate the profile from CV data when the field is missing.
    if (analysis.professionalTitle && !user.headline) {
      user.headline = analysis.professionalTitle;
    }
    if (analysis.professionalTitle && !user.currentRole) {
      user.currentRole = analysis.professionalTitle;
    }
    if (analysis.experienceYears != null) {
      user.experienceYears = analysis.experienceYears;
    }
    if (analysis.location && !user.location) {
      user.location = { region: analysis.location };
    }
    if (Array.isArray(analysis.languages) && analysis.languages.length > 0 && (!Array.isArray(user.languages) || user.languages.length === 0)) {
      user.languages = analysis.languages.map((name) => ({ name, level: 'Native' }));
    }
    const prefs = user.jobPreferences || {};
    if (Array.isArray(analysis.preferredJobTypes) && analysis.preferredJobTypes.length > 0) {
      prefs.preferredJobTypes = Array.from(new Set([...(prefs.preferredJobTypes || []), ...analysis.preferredJobTypes]));
    }
    if (analysis.industry && !(Array.isArray(prefs.industries) && prefs.industries.length > 0)) {
      prefs.industries = [analysis.industry];
    }
    if (analysis.location && !prefs.preferredLocation) {
      prefs.preferredLocation = analysis.location;
    }
    user.jobPreferences = prefs;
    if (analysis.industry && !(Array.isArray(user.careerInterests) && user.careerInterests.length > 0)) {
      user.careerInterests = [analysis.industry];
    }

    user.calculateProfileCompleteness();
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    console.error('Resume parsing failed:', error.message);
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message: 'CV uploaded.', data: user });
});

// @desc    Remove uploaded CV document (profile & Resume Builder data untouched)
// @route   DELETE /api/auth/upload-cv
// @access  Private
exports.deleteCV = asyncHandler(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const existingUser = await User.findById(userId);
  if (!existingUser) return next(new AppError('User not found.', 404));

  const hadUploadedCV = Boolean(existingUser.cv || existingUser.cvPublicId);

  // Delete the stored file from Cloudinary when a reference exists.
  if (existingUser.cvPublicId) {
    try {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(existingUser.cvPublicId);
    } catch (err) {
      console.warn('Cloudinary CV deletion failed (non-fatal):', err.message);
    }
  }

  // Clear the uploaded document fields AND the CV-derived analysis cache, then
  // mark the CV as explicitly detached so profile skills/experience and Resume
  // Builder documents are NOT used as fallback recommendation sources until a
  // new CV is uploaded. Profile and Resume Builder data remain untouched.
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $unset: { cv: '', cvPublicId: '', cvOriginalName: '', resumeAnalysis: '' },
      $set: { cvDetachedAt: new Date() },
    },
    { new: true }
  ).populate('skills', 'name slug');

  user.calculateProfileCompleteness();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: hadUploadedCV ? 'CV removed.' : 'No CV document uploaded.', data: user });
});

// @desc    Upload certificate
// @route   POST /api/auth/upload-certificate
// @access  Private
exports.uploadCertificate = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a certificate file.', 400));

  const user = await User.findById(req.user.id || req.user._id);
  if (!user) return next(new AppError('User not found.', 404));

  const certificate = {
    name: req.file.originalname,
    url: req.file.path,
    publicId: req.file.filename,
    issuer: req.body.issuer || 'Unknown',
    issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
  };

  user.certificates = [...(user.certificates || []), certificate];
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Certificate uploaded successfully.', data: user.certificates });
});
