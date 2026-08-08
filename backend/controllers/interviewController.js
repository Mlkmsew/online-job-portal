const Interview = require('../models/Interview');
const Application = require('../models/Application');
const { asyncHandler, paginate, createNotification } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { sendNotification } = require('../config/socket');

// @desc    Get interviews for current user (employer/job seeker/admin)
// @route   GET /api/interviews
// @access  Private
exports.getInterviews = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === 'employer') {
    query.employer = req.user.id;
  } else if (req.user.role === 'jobseeker') {
    query.applicant = req.user.id;
  } else if (req.user.role === 'admin' && req.query.employer) {
    query.employer = req.query.employer;
  }

  if (req.query.status) query.status = req.query.status;
  if (req.query.application) query.application = req.query.application;
  if (req.query.upcoming === 'true') {
    query.scheduledDate = { $gte: new Date() };
    if (!req.query.status) {
      query.status = { $nin: ['completed', 'cancelled'] };
    }
  }

  const populateOptions = [
    { path: 'applicant', select: 'firstName lastName avatar email' },
    { path: 'employer', select: 'firstName lastName avatar email' },
    { path: 'job', select: 'title' },
    { path: 'company', select: 'name' },
    { path: 'application' },
  ];

  const { results, pagination } = await paginate(Interview, query, req.query, populateOptions);
  const data = results.map(buildInterviewResponse);

  res.status(200).json({ success: true, count: data.length, pagination, data });
});

// @desc    Get eligible interview candidates for current employer
// @route   GET /api/interviews/candidates
// @access  Private (Employer/Admin)
exports.getInterviewCandidates = asyncHandler(async (req, res) => {
  const validStatuses = ['Shortlisted', 'Interview', 'Interview Scheduled', 'Selected', 'Accepted'];

  const applications = await Application.find({
    employer: req.user.id,
    status: { $in: validStatuses },
  })
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title');

  const data = applications.map((application) => ({
    _id: application._id.toString(),
    applicationId: application._id.toString(),
    userId: application.applicant?._id?.toString() || '',
    fullName: `${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim(),
    email: application.applicant?.email || '',
    jobTitle: application.job?.title || '',
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

// @desc    Get shortlisted candidates for current employer
// @route   GET /api/interviews/shortlisted-candidates
// @access  Private (Employer/Admin)
const normalizeInterviewType = (type) => {
  if (!type) return undefined;
  const normalized = `${type}`.trim().toLowerCase();

  if (normalized.includes('zoom') || normalized.includes('meet') || normalized.includes('video') || normalized.includes('online')) return 'Video';
  if (normalized.includes('phone')) return 'Phone';
  if (normalized.includes('in-person') || normalized.includes('in person')) return 'In-person';
  if (normalized.includes('technical')) return 'Technical';
  if (normalized.includes('hr')) return 'HR';
  if (normalized.includes('panel')) return 'Panel';

  return `${type}`.trim();
};

const getMeetingPlatform = (meetingLink) => {
  if (!meetingLink) return '';
  const normalized = `${meetingLink}`.toLowerCase();
  if (normalized.includes('google.com')) return 'Google Meet';
  if (normalized.includes('zoom.us') || normalized.includes('zoom.com')) return 'Zoom';
  if (normalized.includes('teams.microsoft.com') || normalized.includes('microsoft.com')) return 'Microsoft Teams';
  return 'Online Meeting';
};

const buildInterviewResponse = (interview) => {
  if (!interview) return interview;
  const doc = interview.toObject ? interview.toObject() : interview;

  const meetingLocationOrLink = doc.meetingLink || doc.location || '';
  const interviewTime = doc.interviewTime || (doc.scheduledDate ? new Date(doc.scheduledDate).toISOString().slice(11, 16) : undefined);
  const platform = doc.meetingLink ? getMeetingPlatform(doc.meetingLink) : '';

  return {
    ...doc,
    interviewDate: doc.scheduledDate,
    interviewTime,
    interviewType: doc.type,
    meetingLocationOrLink,
    platform,
    invitationNotes: doc.note || '',
    documentsRequired: Array.isArray(doc.requiredDocuments) ? doc.requiredDocuments : [],
  };
};

exports.getShortlistedCandidates = asyncHandler(async (req, res) => {
  const validStatuses = ['Shortlisted', 'Interview'];

  const applications = await Application.find({
    employer: req.user.id,
    status: { $in: validStatuses },
  })
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title');

  const data = applications.map((application) => ({
    _id: application._id.toString(),
    applicationId: application._id.toString(),
    candidateId: application.applicant?._id?.toString() || '',
    userId: application.applicant?._id?.toString() || '',
    fullName: `${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim(),
    email: application.applicant?.email || '',
    jobTitle: application.job?.title || '',
    status: application.status,
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

// @desc    Get interview by ID
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterviewById = asyncHandler(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id)
    .populate('applicant', 'firstName lastName avatar email phone location')
    .populate('employer', 'firstName lastName avatar email')
    .populate('job', 'title')
    .populate('company', 'name');

  if (!interview) return next(new AppError('Interview not found.', 404));

  if (req.user.role !== 'admin' && interview.employer?._id?.toString() !== req.user.id && interview.applicant?._id?.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view this interview.', 403));
  }

  res.status(200).json({ success: true, data: buildInterviewResponse(interview) });
});

// @desc    Schedule a new interview
// @route   POST /api/interviews
// @access  Private (Employer/Admin)
exports.scheduleInterview = asyncHandler(async (req, res, next) => {
  const {
    applicationId,
    application,
    job,
    applicant,
    company,
    scheduledDate,
    date,
    time,
    duration,
    timezone,
    type,
    interviewType,
    location,
    meetingLink,
    meetingLocationOrLink,
    instructions,
    note,
    notes,
    candidateId,
    interviewDate,
    interviewTime,
    invitationNotes,
    requiredDocuments,
  } = req.body;

  const actualApplicationId = applicationId || application;
  const actualDate = interviewDate || date || scheduledDate;
  const actualTime = interviewTime || time;
  const actualType = normalizeInterviewType(interviewType || type);
  const actualLocation = meetingLocationOrLink || location;
  const actualNote = invitationNotes || notes || note;

  if (!actualApplicationId || !actualDate || !actualType) {
    return next(new AppError('Missing required interview fields.', 400));
  }

  const scheduledDateTime = actualTime ? new Date(`${actualDate}T${actualTime}`) : new Date(actualDate);
  if (Number.isNaN(scheduledDateTime.getTime())) {
    return next(new AppError('Invalid interview date or time.', 400));
  }

  const appRecord = await Application.findById(actualApplicationId)
    .populate({ path: 'job', select: 'title postedBy' })
    .populate('company')
    .populate('employer')
    .populate('applicant');

  if (!appRecord) return next(new AppError('Application not found.', 404));

  const isEmployerOwner = req.user.role === 'admin'
    || appRecord.employer?.toString() === req.user.id
    || appRecord.job?.postedBy?.toString() === req.user.id;

  if (!isEmployerOwner) {
    return next(new AppError('Not authorized to schedule interview for this application.', 403));
  }

  if (candidateId && appRecord.applicant?._id?.toString() !== candidateId.toString()) {
    return next(new AppError('Candidate ID does not match the application applicant.', 400));
  }

  const interview = await Interview.create({
    application: appRecord._id,
    job: appRecord.job._id,
    applicant: appRecord.applicant._id,
    employer: req.user.id,
    company: appRecord.company._id,
    scheduledDate: scheduledDateTime,
    duration,
    timezone: timezone || 'Africa/Addis_Ababa',
    type: actualType,
    location: actualLocation,
    meetingLink: meetingLink || (actualLocation && actualLocation.startsWith('http') ? actualLocation : undefined),
    instructions,
    note: actualNote,
    requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
  });

  appRecord.status = 'Interview Scheduled';
  appRecord.interviewDate = scheduledDateTime;
  appRecord.interviewTime = actualTime || scheduledDateTime.toISOString().slice(11, 16);
  appRecord.interviewLocation = actualLocation || appRecord.interviewLocation;
  appRecord.statusHistory.push({ status: 'Interview Scheduled', note: actualNote, changedBy: req.user.id });
  await appRecord.save();

  const notificationPayload = {
    recipient: appRecord.applicant._id,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `${appRecord.company?.name || 'Your employer'} scheduled your interview for ${appRecord.job?.title || 'the position'}.`,
    link: `/dashboard/interviews/${interview._id}`,
    data: { interviewId: interview._id, jobId: appRecord.job._id, applicationId: appRecord._id },
  };

  const notification = await createNotification(notificationPayload);
  sendNotification(appRecord.applicant._id, {
    _id: notification._id?.toString(),
    recipient: notification.recipient,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    data: notification.data,
    isRead: notification.isRead || false,
    createdAt: notification.createdAt,
  });

  res.status(201).json({ success: true, message: 'Interview scheduled successfully.', data: buildInterviewResponse(interview) });
});

// @desc    Update interview details
// @route   PUT /api/interviews/:id
// @access  Private (Employer/Admin)
exports.updateInterview = asyncHandler(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new AppError('Interview not found.', 404));

  if (req.user.role !== 'admin' && interview.employer.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this interview.', 403));
  }

  const previousStatus = interview.status;
  const previousFinalDecision = interview.finalDecision;
  const updates = {};
  const fields = [
    'scheduledDate',
    'duration',
    'timezone',
    'type',
    'location',
    'meetingLink',
    'instructions',
    'note',
    'status',
    'feedback',
    'result',
    'rating',
    'strengths',
    'weaknesses',
    'recommendation',
    'finalDecision',
    'requiredDocuments',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  Object.assign(interview, updates);

  const application = await Application.findById(interview.application);

  if (application) {
    let applicationNeedsSave = false;
    if (req.body.status === 'cancelled' && interview.status !== 'cancelled') {
      application.status = 'Interview Cancelled';
      application.statusHistory.push({ status: 'Interview Cancelled', note: req.body.note || 'Interview cancelled by employer.', changedBy: req.user.id });
      applicationNeedsSave = true;
    }
    if (req.body.status === 'completed' && interview.status !== 'completed') {
      application.status = 'Interview Completed';
      application.statusHistory.push({ status: 'Interview Completed', note: req.body.note || 'Interview completed.', changedBy: req.user.id });
      applicationNeedsSave = true;
    }
    if (req.body.finalDecision && req.body.finalDecision !== previousFinalDecision && interview.status === 'completed') {
      application.statusHistory.push({ status: `Decision: ${req.body.finalDecision}`, note: `Employer decision: ${req.body.finalDecision}`, changedBy: req.user.id });
      applicationNeedsSave = true;
    }
    if (applicationNeedsSave) await application.save();
  }

  await interview.save();

  if (req.body.status === 'cancelled' && previousStatus !== 'cancelled') {
    await createNotification({
      recipient: interview.applicant,
      type: 'interview_scheduled',
      title: 'Interview Cancelled',
      message: `${interview.company?.name || 'Your employer'} cancelled your interview for ${interview.job?.title || 'the position'}.`,
      link: `/dashboard/interviews/${interview._id}`,
      data: { interviewId: interview._id, jobId: interview.job },
    });
  }

  if (req.body.status === 'completed' && previousStatus !== 'completed') {
    await createNotification({
      recipient: interview.applicant,
      type: 'interview_scheduled',
      title: 'Interview Completed',
      message: `${interview.company?.name || 'Your employer'} marked your interview for ${interview.job?.title || 'the position'} as completed.`,
      link: `/dashboard/interviews/${interview._id}`,
      data: { interviewId: interview._id, jobId: interview.job },
    });
  }

  if (req.body.finalDecision && req.body.finalDecision !== previousFinalDecision && interview.status === 'completed') {
    await createNotification({
      recipient: interview.applicant,
      type: 'interview_scheduled',
      title: 'Interview Decision Available',
      message: `${interview.company?.name || 'Your employer'} shared a decision for your interview for ${interview.job?.title || 'the position'}.`,
      link: `/dashboard/interviews/${interview._id}`,
      data: { interviewId: interview._id, jobId: interview.job, decision: req.body.finalDecision },
    });
  }

  res.status(200).json({ success: true, message: 'Interview updated.', data: buildInterviewResponse(interview) });
});

// @desc    Delete an interview
// @route   DELETE /api/interviews/:id
// @access  Private (Employer/Admin)
exports.deleteInterview = asyncHandler(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new AppError('Interview not found.', 404));

  if (req.user.role !== 'admin' && interview.employer.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this interview.', 403));
  }

  await interview.remove();
  res.status(200).json({ success: true, message: 'Interview deleted successfully.' });
});

// @desc    Check upcoming interviews and send automated reminders
exports.checkAndSendInterviewReminders = async () => {
  try {
    const Interview = require('../models/Interview');
    const { createNotification } = require('../utils/helpers');

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingInterviews = await Interview.find({
      status: { $nin: ['completed', 'cancelled'] },
      scheduledDate: { $gte: now, $lte: next24Hours },
      reminderSent: { $ne: true },
    }).populate('applicant job company');

    for (const interview of upcomingInterviews) {
      if (!interview.applicant) continue;

      const dateStr = interview.scheduledDate
        ? new Date(interview.scheduledDate).toLocaleString()
        : 'Tomorrow';

      await createNotification({
        recipient: interview.applicant._id || interview.applicant,
        type: 'interview_reminder',
        title: 'Interview Reminder',
        message: `Reminder: You have an upcoming interview for ${interview.job?.title || 'a position'} at ${interview.company?.name || 'your employer'} scheduled for ${dateStr}.`,
        link: `/dashboard/interviews/${interview._id}`,
        data: { interviewId: interview._id, jobId: interview.job?._id },
      });

      interview.reminderSent = true;
      await interview.save({ validateBeforeSave: false });
    }
  } catch (err) {
    console.error('Interview reminder runner error:', err.message);
  }
};
