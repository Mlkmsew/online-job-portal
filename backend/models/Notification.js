// ============================================
// Notification Model
// ============================================
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    type: {
      type: String,
      enum: [
        'application_submitted',
        'application_reviewed',
        'application_Reviewed',
        'application_shortlisted',
        'application_rejected',
        'application_accepted',
        'interview_scheduled',
        'interview_reminder',
        'new_job',
        'new_message',
        'profile_view',
        'job_closed',
        'system',
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Reference links
    link: { type: String },
    data: { type: mongoose.Schema.Types.Mixed }, // Extra data (job id, application id etc.)

    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
// Prevent duplicate new_job notifications for the same jobseeker + job
notificationSchema.index(
  { recipient: 1, type: 1, 'data.jobId': 1 },
  { unique: true, sparse: true, partialFilterExpression: { type: 'new_job' } }
);

module.exports = mongoose.model('Notification', notificationSchema);
