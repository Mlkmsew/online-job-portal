const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String, trim: true, required: [true, 'First name is required'], maxlength: 50 },
        lastName: { type: String, trim: true, required: [true, 'Last name is required'], maxlength: 50 },
        email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
        password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
        role: { type: String, enum: ['jobseeker', 'employer', 'admin'], default: 'jobseeker' },

        // Profile
        avatar: String,
        avatarPublicId: String,
        cv: String,
        cvPublicId: String,
        phone: String,
        headline: String,
        bio: String,
        dateOfBirth: Date,
        gender: String,
        location: Object,
        skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
        certificates: [{ name: String, url: String, publicId: String, issuer: String, issueDate: Date }],
        experience: String,
        education: [String],
        resumeAnalysis: {
            skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
            education: [String],
            experienceYears: Number,
            location: String,
            certifications: [String],
            rawText: String,
        },

        // Status & security
        isActive: { type: Boolean, default: true },
        isSuspended: { type: Boolean, default: false },
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationToken: String,
        emailVerificationExpire: Date,
        // OTP for quick verification (numeric) and two-factor
        otpCode: String,
        otpExpire: Date,
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: String,
        // Social providers
        googleId: String,
        githubId: String,
        // Refresh tokens (hashed) for remember-me sessions
        refreshTokens: [String],
        // Pending email change flow
        pendingEmail: String,
        pendingEmailOTP: String,
        pendingEmailExpire: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,

        // Stats
        profileViews: { type: Number, default: 0 },
        profileCompleteness: { type: Number, default: 0 },
        lastLogin: Date,

        settings: {
            account: { type: Object, default: {} },
            companyProfile: { type: Object, default: {} },
            notifications: { type: Object, default: {} },
            privacy: { type: Object, default: {} },
            companyPreferences: { type: Object, default: {} },
            notificationPreferences: { type: Object, default: {} },
            appearance: { type: Object, default: {} },
            theme: { type: String, default: 'Light' },
        },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Generate numeric OTP (6 digits)
userSchema.methods.generateOTP = function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpCode = crypto.createHash('sha256').update(code).digest('hex');
    this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return code;
};

// Verify OTP
userSchema.methods.verifyOTP = function (code) {
    if (!this.otpCode || !this.otpExpire) return false;
    if (Date.now() > this.otpExpire) return false;
    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    return hashed === this.otpCode;
};

// Manage refresh tokens (store hashed)
userSchema.methods.addRefreshToken = function (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    this.refreshTokens = this.refreshTokens || [];
    this.refreshTokens.push(hashed);
};

userSchema.methods.hasRefreshToken = function (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    return (this.refreshTokens || []).includes(hashed);
};

userSchema.methods.removeRefreshToken = function (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    this.refreshTokens = (this.refreshTokens || []).filter((t) => t !== hashed);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
};

// Calculate simple profile completeness score
userSchema.methods.calculateProfileCompleteness = function () {
    let score = 0;
    if (this.firstName) score += 20;
    if (this.lastName) score += 20;
    if (this.email) score += 10;
    if (this.avatar) score += 10;
    if (this.cv) score += 20;
    if (this.bio) score += 20;
    this.profileCompleteness = Math.min(100, score);
    return this.profileCompleteness;
};

// Ensure model reuse in serverless / watch environments
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;