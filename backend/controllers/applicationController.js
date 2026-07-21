// ============================================
// Application Controller
// ============================================
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/user');
const Interview = require('../models/Interview');
const { asyncHandler, paginate, createNotification } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../config/email');

// Helper to calculate AI match score
const calculateMatchScore = (job, user) => {
  let score = 0;
  
  // 1. Skill Match (up to 50 points)
  if (job.skillsRequired && job.skillsRequired.length > 0) {
    const jobSkillIds = job.skillsRequired.map(s => s._id ? s._id.toString() : s.toString());
    const userSkillIds = (user.skills || []).map(s => s._id ? s._id.toString() : s.toString());
    const matchedSkills = jobSkillIds.filter(s => userSkillIds.includes(s));
    
    const skillPercentage = jobSkillIds.length > 0 ? matchedSkills.length / jobSkillIds.length : 1;
    score += skillPercentage * 50;
  } else {
    score += 40;
  }

  // 2. Title / Headline Match (up to 30 points)
  const jobTitleText = (job.title || '').toLowerCase();
  const userHeadlineText = (user.headline || '').toLowerCase();
  const userBioText = (user.bio || '').toLowerCase();
  
  if (userHeadlineText) {
    const titleWords = jobTitleText.split(/\s+/).filter(w => w.length > 3);
    let matchedTitleWords = 0;
    titleWords.forEach(word => {
      if (userHeadlineText.includes(word) || userBioText.includes(word)) {
        matchedTitleWords++;
      }
    });
    if (titleWords.length > 0) {
      score += (matchedTitleWords / titleWords.length) * 30;
    } else {
      score += 20;
    }
  }

  // 3. Experience Match (up to 20 points)
  const experienceMap = {
    'Entry Level': ['entry', 'junior', 'fresh', '0-2', 'graduate'],
    'Mid Level': ['mid', 'intermediate', '2-5'],
    'Senior Level': ['senior', 'expert', 'lead', '5+'],
  };
  
  const jobExp = job.experienceLevel;
  if (jobExp && experienceMap[jobExp]) {
    const keywords = experienceMap[jobExp];
    const isKeywordMatch = keywords.some(k => userHeadlineText.includes(k) || userBioText.includes(k));
    if (isKeywordMatch) {
      score += 20;
    } else {
      score += 10;
    }
  } else {
    score += 20;
  }

  return Math.min(100, Math.max(10, Math.round(score)));
};

const getNotificationTypeForStatus = (status) => {
  const normalizedStatus = (status || '').toLowerCase();

  switch (normalizedStatus) {
    case 'submitted':
      return 'application_submitted';
    case 'reviewed':
      return 'application_reviewed';
    case 'shortlisted':
      return 'application_shortlisted';
    case 'rejected':
      return 'application_rejected';
    case 'selected':
    case 'hired':
    case 'accepted':
      return 'application_accepted';
    case 'interview':
      return 'interview_scheduled';
    default:
      return 'application_submitted';
  }
};

// @desc    Apply for job
// @route   POST /api/applications
// @access  Private (Job Seeker)
exports.applyJob = asyncHandler(async (req, res, next) => {
  const { job: jobId, coverLetter, useProfileCV } = req.body;

  const job = await Job.findById(jobId).populate('company postedBy');
  if (!job) return next(new AppError('Job not found.', 404));
  if (job.status !== 'active') return next(new AppError('This job is no longer accepting applications.', 400));
  if (new Date(job.applicationDeadline) < new Date()) {
    return next(new AppError('Application deadline has passed.', 400));
  }

  // Check duplicate
  const existing = await Application.findOne({ job: jobId, applicant: req.user.id });
  if (existing) return next(new AppError('You have already applied for this job.', 400));

  // Get full user with skills to compute AI match score
  const user = await User.findById(req.user.id).populate('skills');

  // Compute AI match score
  const matchScore = calculateMatchScore(job, user);

  // Create application
  const application = await Application.create({
    job: jobId,
    applicant: req.user.id,
    company: job.company._id,
    employer: job.postedBy._id,
    coverLetter,
    useProfileCV,
    resumeUrl: req.file ? req.file.path : req.user.cv,
    matchScore,
  });

  // Update job applicant count
  job.applicantsCount += 1;
  await job.save({ validateBeforeSave: false });

  // Notify employer
  await createNotification({
    recipient: job.postedBy._id,
    type: 'application_submitted',
    title: 'New Application Received',
    message: `${req.user.firstName} ${req.user.lastName} applied for ${job.title}`,
    link: `/employer/applications/${application._id}`,
    data: { applicationId: application._id, jobId },
  });

  // Send email to applicant
  try {
    const template = emailTemplates.applicationReceived(req.user.firstName, job.title, job.company.name);
    await sendEmail({ to: req.user.email, ...template });
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.status(201).json({ success: true, message: 'Application submitted successfully!', data: application });
});

// @desc    Get my applications (job seeker)
// @route   GET /api/applications/my
// @access  Private (Job Seeker)
exports.getMyApplications = asyncHandler(async (req, res) => {
  const query = { applicant: req.user.id };
  if (req.query.status) query.status = req.query.status;

  const { results, pagination } = await paginate(Application, query, req.query, [
    { path: 'job', populate: { path: 'company', select: 'name logo' } },
    { path: 'company', select: 'name logo' },
  ]);

  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Get applications for employer
// @route   GET /api/applications/employer
// @access  Private (Employer)
exports.getEmployerApplications = asyncHandler(async (req, res) => {
  const query = { employer: req.user.id };
  if (req.query.status) query.status = req.query.status;
  if (req.query.job) query.job = req.query.job;

  // Default sorting to highest matchScore first
  const sortBy = req.query.sort || '-matchScore';

  const { results, pagination } = await paginate(Application, query, req.query, [
    'job',
    { path: 'applicant', populate: { path: 'skills' } },
    'company',
  ], sortBy);

  res.status(200).json({ success: true, count: results.length, pagination, data: results });
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('job')
    .populate('applicant')
    .populate('company')
    .populate('employer', 'firstName lastName email');

  if (!application) return next(new AppError('Application not found.', 404));

  // Check authorization
  const isApplicant = application.applicant._id.toString() === req.user.id;
  const isEmployer = application.employer._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isApplicant && !isEmployer && !isAdmin) {
    return next(new AppError('Not authorized.', 403));
  }

  // Mark as read if employer
  if (isEmployer && !application.isRead) {
    application.isRead = true;
    application.reviewedAt = new Date();
    await application.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, data: application });
});

// @desc    Schedule interview for application
// @route   POST /api/applications/:id/schedule-interview
// @access  Private (Employer)
exports.scheduleInterviewForApplication = asyncHandler(async (req, res, next) => {
  const { interviewDate, interviewTime, interviewLocation, note } = req.body;
  const application = await Application.findById(req.params.id).populate('applicant job company employer');

  if (!application) return next(new AppError('Application not found.', 404));
  if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  application.status = 'Interview';
  if (interviewDate) application.interviewDate = new Date(interviewDate);
  if (interviewTime) application.interviewTime = interviewTime;
  if (interviewLocation) application.interviewLocation = interviewLocation;
  if (note) application.employerNote = note;
  application.statusHistory.push({ status: 'Interview', note, changedBy: req.user.id });
  await application.save();

  const interviewDateTime = application.interviewDate
    ? new Date(`${application.interviewDate.toISOString().split('T')[0]}T${application.interviewTime || '09:00'}`)
    : new Date();

  const interview = await Interview.create({
    application: application._id,
    job: application.job._id,
    applicant: application.applicant._id,
    employer: application.employer._id,
    company: application.company._id,
    scheduledDate: interviewDateTime,
    location: application.interviewLocation,
    note,
  });

  await createNotification({
    recipient: application.applicant._id,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `Your interview for ${application.job.title} has been scheduled.`,
    link: `/dashboard/applications/${application._id}`,
    data: { applicationId: application._id, interviewId: interview._id },
  });

  res.status(200).json({ success: true, message: 'Interview scheduled successfully.', data: { application, interview } });
});

// @desc    Update application status (employer)
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const application = await Application.findById(req.params.id).populate('applicant job');

  if (!application) return next(new AppError('Application not found.', 404));
  if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  application.status = status;
  if (note) application.employerNote = note;
  application.statusHistory.push({ status, note, changedBy: req.user.id });
  await application.save();

  // Notify applicant
  await createNotification({
    recipient: application.applicant._id,
    type: getNotificationTypeForStatus(status),
    title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your application for ${application.job.title} has been ${status}.`,
    link: `/dashboard/applications/${application._id}`,
  });

  res.status(200).json({ success: true, message: 'Application status updated.', data: application });
});

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Job Seeker)
exports.withdrawApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);
  if (!application) return next(new AppError('Application not found.', 404));
  if (application.applicant.toString() !== req.user.id) {
    return next(new AppError('Not authorized.', 403));
  }

  application.status = 'withdrawn';
  application.withdrawnAt = new Date();
  await application.save();

  res.status(200).json({ success: true, message: 'Application withdrawn.' });
});

// @desc    Bookmark applicant (employer)
// @route   PUT /api/applications/:id/bookmark
// @access  Private (Employer)
exports.bookmarkApplicant = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);
  if (!application) return next(new AppError('Application not found.', 404));
  if (application.employer.toString() !== req.user.id) return next(new AppError('Not authorized.', 403));

  application.isBookmarked = !application.isBookmarked;
  await application.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, isBookmarked: application.isBookmarked });
});

// @desc    Download applicant resume (employer or applicant)
// @route   GET /api/applications/:id/resume
// @access  Private (Employer/Applicant/Admin)
exports.downloadResume = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id).populate('applicant');
  if (!application) return next(new AppError('Application not found.', 404));

  const isApplicant = application.applicant._id.toString() === req.user.id;
  const isEmployer = application.employer.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isApplicant && !isEmployer && !isAdmin) return next(new AppError('Not authorized.', 403));

  const url = application.resumeUrl || application.applicant.cv;
  if (!url) return next(new AppError('No resume available for this applicant.', 404));

  // If URL looks like http(s), redirect for download; otherwise assume local file path
  if (/^https?:\/\//i.test(url)) {
    return res.redirect(url);
  }

  // Local file path -> stream
  const path = require('path');
  const fs = require('fs');
  const filePath = path.isAbsolute(url) ? url : path.join(process.cwd(), url);
  if (!fs.existsSync(filePath)) return next(new AppError('Resume file not found on server.', 404));

  res.download(filePath, `${application.applicant.firstName || 'applicant'}-resume${path.extname(filePath)}`);
});

// @desc    Export employer applications as CSV
// @route   GET /api/applications/employer/export
// @access  Private (Employer/Admin)
exports.exportEmployerApplications = asyncHandler(async (req, res) => {
  const query = { employer: req.user.id };
  if (req.query.job) query.job = req.query.job;
  if (req.query.status) query.status = req.query.status;

  const applications = await Application.find(query).populate('job applicant company');

  const csvCols = ['Application ID', 'Job Title', 'Applicant Name', 'Applicant Email', 'Status', 'Applied At', 'Resume URL'];
  const rows = applications.map((a) => [
    a._id,
    a.job?.title || '',
    `${a.applicant?.firstName || ''} ${a.applicant?.lastName || ''}`.trim(),
    a.applicant?.email || '',
    a.status,
    a.appliedAt?.toISOString() || '',
    a.resumeUrl || a.applicant?.cv || '',
  ]);

  const csv = [csvCols.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="applications_${Date.now()}.csv"`);
  res.send(csv);
});

// Helper to update status with notification
const changeStatus = async (application, status, user, note) => {
  application.status = status;
  if (note) application.employerNote = note;
  application.statusHistory.push({ status, note, changedBy: user.id });
  await application.save();
  // notify applicant
  await createNotification({
    recipient: application.applicant._id,
    type: getNotificationTypeForStatus(status),
    title: `Application ${status}`,
    message: `Your application for ${application.job.title} has been ${status}.`,
    link: `/dashboard/applications/${application._id}`,
  });
};

// @desc    Shortlist applicant
// @route   PUT /api/applications/:id/shortlist
// @access  Private (Employer)
exports.shortlistApplicant = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id).populate('job applicant');
  if (!application) return next(new AppError('Application not found.', 404));
  if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') return next(new AppError('Not authorized.', 403));

  await changeStatus(application, 'Reviewed', req.user, req.body.note);
  res.status(200).json({ success: true, message: 'Applicant shortlisted.', data: application });
});

// @desc    Hire / accept applicant
// @route   PUT /api/applications/:id/hire
// @access  Private (Employer)
exports.hireApplicant = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id).populate('job applicant');
  if (!application) return next(new AppError('Application not found.', 404));
  if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') return next(new AppError('Not authorized.', 403));

  await changeStatus(application, 'Selected', req.user, req.body.note);
  res.status(200).json({ success: true, message: 'Applicant accepted/hired.', data: application });
});

// @desc    Reject applicant
// @route   PUT /api/applications/:id/reject
// @access  Private (Employer)
exports.rejectApplicant = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id).populate('job applicant');
  if (!application) return next(new AppError('Application not found.', 404));
  if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') return next(new AppError('Not authorized.', 403));

  await changeStatus(application, 'Not Selected', req.user, req.body.note);
  res.status(200).json({ success: true, message: 'Applicant rejected.', data: application });
});

module.exports = exports;
