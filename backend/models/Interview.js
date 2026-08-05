// ============================================
// Interview Model
// ============================================
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    // Schedule
    scheduledDate: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // minutes
    timezone: { type: String, default: 'Africa/Addis_Ababa' },

    // Type
    type: {
      type: String,
      enum: ['In-person', 'Phone', 'Video', 'Technical', 'HR', 'Panel'],
      default: 'In-person',
    },
    round: { type: Number, default: 1 },

    // Location / Link
    location: { type: String },
    meetingLink: { type: String },
    meetingId: { type: String },
    meetingPassword: { type: String },

    // Notes
    instructions: { type: String },
    note: { type: String }, // Internal employer note

    // Status
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'],
      default: 'scheduled',
    },
    applicantConfirmed: { type: Boolean, default: false },
    applicantConfirmedAt: { type: Date },

    // Feedback
    feedback: { type: String },
    result: { type: String, enum: ['pass', 'fail', 'pending', 'hold'] },
    rating: { type: Number, min: 1, max: 5 },
    strengths: { type: String },
    weaknesses: { type: String },
    recommendation: { type: String },
    finalDecision: { type: String },
  },
  { timestamps: true }
);

interviewSchema.index({ applicant: 1, scheduledDate: 1 });
interviewSchema.index({ employer: 1 });
interviewSchema.index({ application: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
