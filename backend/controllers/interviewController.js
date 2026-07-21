const Interview = require('../models/Interview');
const { asyncHandler, paginate, createNotification } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

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
  if (req.query.upcoming === 'true') query.scheduledDate = { $gte: new Date() };

  const { results, pagination } = await paginate(Interview, query, req.query, [
    { path: 'applicant', select: 'firstName lastName avatar email' },
    { path: 'employer', select: 'firstName lastName avatar email' },
    'job',
    'company',
  ]);

  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Schedule a new interview
// @route   POST /api/interviews
// @access  Private (Employer/Admin)
exports.scheduleInterview = asyncHandler(async (req, res, next) => {
  const {
    application,
    job,
    applicant,
    company,
    scheduledDate,
    duration,
    timezone,
    type,
    location,
    meetingLink,
    instructions,
    note,
  } = req.body;

  if (!application || !job || !applicant || !company || !scheduledDate) {
    return next(new AppError('Missing required interview fields.', 400));
  }

  const interview = await Interview.create({
    application,
    job,
    applicant,
    employer: req.user.id,
    company,
    scheduledDate,
    duration,
    timezone,
    type,
    location,
    meetingLink,
    instructions,
    note,
  });

  await createNotification({
    recipient: applicant,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `Your interview for the selected position has been scheduled.`,
    link: `/dashboard/applications/${application}`,
    data: { interviewId: interview._id, jobId: job },
  });

  res.status(201).json({ success: true, message: 'Interview scheduled successfully.', data: interview });
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
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  Object.assign(interview, updates);
  await interview.save();

  res.status(200).json({ success: true, message: 'Interview updated.', data: interview });
});
