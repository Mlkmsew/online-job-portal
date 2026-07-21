// ============================================
// Review Model - Company Reviews
// ============================================
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Ratings
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    ratings: {
      workLifeBalance: { type: Number, min: 1, max: 5 },
      salaryBenefits: { type: Number, min: 1, max: 5 },
      jobSecurity: { type: Number, min: 1, max: 5 },
      management: { type: Number, min: 1, max: 5 },
      culture: { type: Number, min: 1, max: 5 },
    },

    title: { type: String, maxlength: 150 },
    pros: { type: String, maxlength: 1000 },
    cons: { type: String, maxlength: 1000 },
    advice: { type: String, maxlength: 1000 },

    // Employment Info
    jobTitle: { type: String },
    employmentStatus: {
      type: String,
      enum: ['Current Employee', 'Former Employee'],
    },
    employmentType: { type: String },
    yearsWorked: { type: Number },

    // Flags
    isAnonymous: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ company: 1 });
reviewSchema.index({ reviewer: 1, company: 1 }, { unique: true }); // One review per company per user

// Update company average rating after save
reviewSchema.post('save', async function () {
  const Company = require('./Company');
  const stats = await this.constructor.aggregate([
    { $match: { company: this.company, isApproved: true } },
    {
      $group: {
        _id: '$company',
        avgRating: { $avg: '$overallRating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Company.findByIdAndUpdate(this.company, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
