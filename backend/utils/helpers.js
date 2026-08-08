// ============================================
// General Helper Utilities
// ============================================
const crypto = require('crypto');

/**
 * Async error wrapper - eliminates try/catch boilerplate
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Paginate results helper
 */
const paginate = async (model, query, queryString, populate = [], sortBy = '-createdAt') => {
  const page = parseInt(queryString.page) || 1;
  const limit = parseInt(queryString.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await model.countDocuments(query);

  let dbQuery = model.find(query).skip(skip).limit(limit).sort(sortBy);
  if (populate.length) {
    populate.forEach((p) => {
      dbQuery = dbQuery.populate(p);
    });
  }

  const results = await dbQuery;

  return {
    results,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Create notification helper - respects user notification preferences & sends emails
 */
const createNotification = async (data) => {
  const Notification = require('../models/Notification');
  const User = require('../models/user');
  const { sendEmail, emailTemplates } = require('../config/email');

  if (!data || !data.recipient) return null;

  try {
    const recipientUser = await User.findById(data.recipient);
    if (!recipientUser) return null;

    const notifSettings = recipientUser.settings?.notifications || {};

    const emailAlerts = notifSettings.email_alerts ?? notifSettings.email ?? true;
    const inAppNotifs = notifSettings.in_app_notifications ?? notifSettings.inapp ?? true;
    const jobMatchAlerts = notifSettings.job_match_alerts ?? notifSettings.match ?? true;
    const applicationStatusAlerts = notifSettings.application_status ?? notifSettings.application ?? true;
    const interviewRemindersAlerts = notifSettings.interview_reminders ?? notifSettings.interview ?? true;

    // Category preference check
    const isAppStatusType = [
      'application_submitted',
      'application_reviewed',
      'application_Reviewed',
      'application_shortlisted',
      'application_rejected',
      'application_accepted',
    ].includes(data.type);

    const isJobMatchType = data.type === 'new_job';
    const isInterviewType = ['interview_scheduled', 'interview_reminder'].includes(data.type);

    if (isAppStatusType && !applicationStatusAlerts) {
      console.log(`[Notification Skipped] Recipient ${recipientUser.email} has application_status = false`);
      return null;
    }

    if (isJobMatchType && !jobMatchAlerts) {
      console.log(`[Notification Skipped] Recipient ${recipientUser.email} has job_match_alerts = false`);
      return null;
    }

    if (isInterviewType && !interviewRemindersAlerts) {
      console.log(`[Notification Skipped] Recipient ${recipientUser.email} has interview_reminders = false`);
      return null;
    }

    let createdDoc = null;

    // Create In-App Notification if enabled
    if (inAppNotifs) {
      try {
        createdDoc = await Notification.create(data);
        try {
          const { sendNotification } = require('../config/socket');
          if (sendNotification) sendNotification(data.recipient.toString(), createdDoc);
        } catch (e) {
          // Socket not active or unavailable
        }
      } catch (err) {
        if (err.code !== 11000) console.error('Error saving notification:', err.message);
      }
    } else {
      console.log(`[In-App Skipped] Recipient ${recipientUser.email} has in_app_notifications = false`);
    }

    // Send Email Alert if enabled & user email exists
    if (emailAlerts && recipientUser.email) {
      try {
        let mailPayload = {
          to: recipientUser.email,
          subject: data.title,
          text: `${data.message}\n\n— OnlineJob Portal`,
          html: `<div style="font-family:sans-serif;padding:20px;color:#334155;"><h2 style="color:#0F766E">${data.title}</h2><p style="font-size:15px;line-height:1.6">${data.message}</p></div>`,
        };

        if (isInterviewType && emailTemplates.interviewInvitation) {
          mailPayload = {
            to: recipientUser.email,
            ...emailTemplates.interviewInvitation(
              recipientUser.firstName || 'Candidate',
              data.title || 'Interview',
              'OnlineJob Portal Employer',
              data.message || 'Scheduled interview',
              'Online / Check Portal'
            ),
          };
        } else if (isAppStatusType && emailTemplates.applicationReceived) {
          mailPayload = {
            to: recipientUser.email,
            ...emailTemplates.applicationReceived(
              recipientUser.firstName || 'Applicant',
              data.title || 'Application Update',
              'OnlineJob Portal Employer'
            ),
          };
        }

        sendEmail(mailPayload).catch((emailErr) => {
          console.error(`[Email Alert Failed] ${recipientUser.email}:`, emailErr.message);
        });
      } catch (emailErr) {
        console.error('Email alert generation error:', emailErr.message);
      }
    }

    return createdDoc;
  } catch (err) {
    console.error('createNotification helper error:', err.message);
    return null;
  }
};

/**
 * Hash a token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Escape user input for safe RegExp construction
 */
const escapeRegex = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Pick only allowed fields from object
 */
const pick = (obj, fields) => {
  const result = {};
  fields.forEach((field) => {
    if (obj[field] !== undefined) result[field] = obj[field];
  });
  return result;
};

/**
 * Format salary range string
 */
const formatSalary = (salary) => {
  if (!salary) return 'Not specified';
  const { min, max, currency, period, isNegotiable } = salary;
  if (!min && !max) return isNegotiable ? 'Negotiable' : 'Not specified';
  const fmt = (n) => n?.toLocaleString('en-ET') || '';
  const range = min && max ? `${fmt(min)} - ${fmt(max)}` : min ? `From ${fmt(min)}` : `Up to ${fmt(max)}`;
  return `${currency || 'ETB'} ${range} / ${period || 'Month'}${isNegotiable ? ' (Negotiable)' : ''}`;
};

module.exports = { asyncHandler, paginate, createNotification, hashToken, pick, formatSalary, escapeRegex };
