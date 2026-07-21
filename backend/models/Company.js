// ============================================
// Company Model
// ============================================
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: [true, 'Company name is required'], trim: true, unique: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, maxlength: 5000 },
    shortDescription: { type: String, maxlength: 300 },
    tagline: { type: String, maxlength: 150 },

    // Media
    logo: { type: String, default: '' },
    logoPublicId: { type: String },
    coverImage: { type: String },
    coverImagePublicId: { type: String },

    // Industry & Size
    industry: { type: String },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    },
    foundedYear: { type: Number },
    companyType: {
      type: String,
      enum: ['Private', 'Public', 'NGO', 'Government', 'Startup', 'MNC', 'Other'],
    },

    // Contact
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    location: {
      region: { type: String },
      city: { type: String },
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    // Social
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
    },

    // Ownership
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Status
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Stats
    totalJobs: { type: Number, default: 0 },
    totalHires: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },

    // Benefits
    benefits: [String],
    techStack: [String],

    // Documents
    registrationNumber: { type: String },
    verificationDocument: { type: String },

    // Rating
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ isApproved: 1, isActive: 1 });
companySchema.index({ owner: 1 });

// Generate slug from name before save
companySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Company', companySchema);
