// ============================================
// Job Model
// ============================================
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    // Basic Info
    title: { type: String, required: [true, 'Job title is required'], trim: true, maxlength: 150 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: [true, 'Job description is required'], maxlength: 10000 },
    requirements: { type: String, maxlength: 5000 },
    responsibilities: { type: String, maxlength: 5000 },
    benefits: { type: [String], default: [] },
    skills: {
      technical: { type: [String], default: [] },
      soft: { type: [String], default: [] },
    },

    // Relationships
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    skillsRequired: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],

    // Job Details
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Temporary'],
      required: true,
    },
    workMode: {
      type: String,
      enum: ['On-site', 'Remote', 'Hybrid'],
      default: 'On-site',
    },
    genderPreference: {
      type: String,
      enum: ['any', 'male', 'female', 'other'],
      default: 'any',
      lowercase: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Director', 'Executive'],
    },
    educationRequired: {
      type: String,
      enum: ['No Requirement', 'High School', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Professional Certificate'],
    },
    numberOfPositions: { type: Number, default: 1, min: 1 },

    // Salary
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'ETB' },
      period: { type: String, enum: ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'], default: 'Monthly' },
      isNegotiable: { type: Boolean, default: false },
      isVisible: { type: Boolean, default: true },
    },

    // Location
    location: {
      region: { type: String, required: true },
      city: { type: String },
      address: { type: String },
    },

    // Application
    applicationDeadline: { type: Date, required: true },
    applicationEmail: { type: String },
    applicationUrl: { type: String },
    applicationMethod: {
      type: String,
      enum: ['Portal', 'Email', 'External'],
      default: 'Portal',
    },

    // Employer-defined application fields/questions shown on the Apply Now page.
    // Each field carries its own Required/Optional configuration. `options` is
    // used by the 'select' (dropdown) type.
    applicationFields: [
      {
        label: { type: String, trim: true, maxlength: 200 },
        type: {
          type: String,
          enum: ['text', 'textarea', 'url', 'number', 'email', 'phone', 'date', 'select', 'checkbox'],
          default: 'text',
        },
        options: { type: [String], default: [] },
        required: { type: Boolean, default: false },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['pending', 'published', 'active', 'draft', 'closed', 'expired', 'paused'],
      default: 'pending',
    },
    publishedAt: { type: Date },
    isFeatured: { type: Boolean, default: false },
    isUrgent: { type: Boolean, default: false },
    isRemote: { type: Boolean, default: false },

    // Stats
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },

    // Tags
    tags: [String],

    // Admin
    isApproved: { type: Boolean, default: false },
    adminNote: { type: String },
    // Accessibility / Inclusive Hiring
    accessibility: {
      disabilityFriendly: { type: Boolean, default: false },
      accommodations: { type: String, maxlength: 2000 },
      accessibilityInfo: { type: String, maxlength: 2000 },
      remoteFriendly: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search
jobSchema.index({ title: 'text', description: 'text', requirements: 'text' });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ 'location.region': 1, 'location.city': 1 });
jobSchema.index({ jobType: 1, workMode: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual - is expired
jobSchema.virtual('isExpired').get(function () {
  return this.applicationDeadline < new Date();
});

// Virtual - days remaining
jobSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

// Generate slug
jobSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const unique = `${base}-${Date.now()}`;
    this.slug = unique;
  }

  // Auto-close if deadline passed
  if (this.applicationDeadline < new Date() && (this.status === 'active' || this.status === 'published')) {
    this.status = 'expired';
  }

  next();
});

module.exports = mongoose.model('Job', jobSchema);
