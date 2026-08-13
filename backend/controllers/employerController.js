const { asyncHandler } = require('../utils/helpers');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const Company = require('../models/Company');
const User = require('../models/user');

// @desc  Get real employer dashboard summary & analytics from MongoDB
// @route GET /api/employer/dashboard
// @access Private (employer)
exports.getDashboard = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  // Find company owned by or linked to employer
  const company = await Company.findOne({ owner: employerId });
  const companyId = company?._id;

  // Filter queries scoped strictly to currently logged-in employer
  const jobFilter = companyId
    ? { $or: [{ postedBy: employerId }, { company: companyId }] }
    : { postedBy: employerId };

  const appFilter = companyId
    ? { $or: [{ employer: employerId }, { company: companyId }] }
    : { employer: employerId };

  const interviewFilter = companyId
    ? { $or: [{ employer: employerId }, { company: companyId }] }
    : { employer: employerId };

  const now = new Date();
  const sevenDaysAgo = new Date(now.valueOf() - 7 * 24 * 60 * 60 * 1000);

  // Database aggregations for exact statistics
  const [
    totalJobs,
    activeJobs,
    closedJobs,
    totalApplicants,
    newApplicantsCount,
    submittedCount,
    underReviewCount,
    interviewStageCount,
    hiredCount,
    upcomingInterviewsCount,
    upcomingInterviewsList,
    recentApplicantsList,
    recentNotificationsList,
  ] = await Promise.all([
    Job.countDocuments(jobFilter),
    Job.countDocuments({ ...jobFilter, status: { $in: ['active', 'published'] } }),
    Job.countDocuments({ ...jobFilter, status: { $in: ['closed', 'expired'] } }),
    Application.countDocuments(appFilter),
    Application.countDocuments({ ...appFilter, createdAt: { $gte: sevenDaysAgo } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Submitted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Reviewed', 'Under Review'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Interview', 'Interview Scheduled', 'Interview Completed', 'Shortlisted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Hired', 'Selected'] } }),
    Interview.countDocuments({ ...interviewFilter, scheduledDate: { $gte: now } }),
    Interview.find({ ...interviewFilter, scheduledDate: { $gte: now } })
      .populate('applicant', 'firstName lastName name email avatar')
      .populate('job', 'title')
      .sort({ scheduledDate: 1 })
      .limit(10),
    Application.find(appFilter)
      .populate('applicant', 'firstName lastName name email avatar')
      .populate('job', 'title slug')
      .sort({ createdAt: -1 })
      .limit(10),
    Notification.find({ recipient: employerId, type: { $ne: 'new_message' } })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  // Analytics funnel calculation from real DB records
  const countNew = submittedCount > 0 ? submittedCount : newApplicantsCount;
  const countReview = underReviewCount;
  const countInterview = interviewStageCount;
  const countHired = hiredCount;

  const totalFunnel = countNew + countReview + countInterview + countHired;

  const analytics = {
    newApplications: {
      count: countNew,
      percentage: totalFunnel > 0 ? Math.round((countNew / totalFunnel) * 100) : 0,
    },
    underReview: {
      count: countReview,
      percentage: totalFunnel > 0 ? Math.round((countReview / totalFunnel) * 100) : 0,
    },
    interview: {
      count: countInterview,
      percentage: totalFunnel > 0 ? Math.round((countInterview / totalFunnel) * 100) : 0,
    },
    hired: {
      count: countHired,
      percentage: totalFunnel > 0 ? Math.round((countHired / totalFunnel) * 100) : 0,
    },
  };

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplicants,
      newApplicantsCount,
      underReviewCount,
      interviewStageCount,
      hiredCount,
      interviewsCount: upcomingInterviewsCount,
      analytics,
      upcomingInterviews: upcomingInterviewsList,
      recentApplicants: recentApplicantsList,
      recentNotifications: recentNotificationsList,
      company: company || null,
    },
  });
});
