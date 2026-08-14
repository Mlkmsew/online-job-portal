// ============================================
// Application Model
// ============================================
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Cover Letter & Documents
    coverLetter: { type: String, maxlength: 3000 },
    resumeUrl: { type: String },
    resumePublicId: { type: String },
    useProfileCV: { type: Boolean, default: false },
    matchScore: { type: Number, default: 0 },

    // Screening answers captured at apply time
    expectedSalary: { type: String },
    isSalaryNegotiable: { type: Boolean, default: false },
    availability: { type: String },
    portfolioUrl: { type: String },
    githubUrl: { type: String },
    linkedinUrl: { type: String },

    // Status Tracking
    status: {
      type: String,
      enum: ['Submitted', 'Reviewed', 'Shortlisted', 'Interview', 'Interview Scheduled', 'Interview Completed', 'Interview Cancelled', 'Rejected', 'Selected', 'Not Selected', 'Hired', 'withdrawn'],
      default: 'Submitted',
    },

    // Timeline / Status History
    statusHistory: [
      {
        status: { type: String },
        note: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // Employer Notes
    employerNote: { type: String },
    rating: { type: Number, min: 1, max: 5 },

    // Interview Scheduling
    interviewDate: { type: Date },
    interviewTime: { type: String },
    interviewLocation: { type: String },

    // Screening
    screeningAnswers: [
      {
        question: String,
        answer: String,
      },
    ],

    // Flags
    isRead: { type: Boolean, default: false },
    isBookmarked: { type: Boolean, default: false }, // Employer bookmarked this applicant

    // Timestamps
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    withdrawnAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // One application per job
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ company: 1, status: 1 });
applicationSchema.index({ employer: 1 });
applicationSchema.index({ appliedAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
