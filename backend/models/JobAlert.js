const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Alert title is required'], trim: true },
    region: { type: String, trim: true },
    city: { type: String, trim: true },
    jobType: { type: String, trim: true },
    keywords: { type: String, trim: true },
    active: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },
  },
  { timestamps: true }
);

jobAlertSchema.index({ user: 1, title: 1 }, { unique: true });

const JobAlert = mongoose.models.JobAlert || mongoose.model('JobAlert', jobAlertSchema);
module.exports = JobAlert;
