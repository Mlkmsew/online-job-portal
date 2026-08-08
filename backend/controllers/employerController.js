const { asyncHandler } = require('../utils/helpers');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');

// @desc  Get employer dashboard summary
// @route GET /api/employer/dashboard
// @access Private (employer)
exports.getDashboard = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  const [totalJobs, activeJobs, closedJobs, totalApplicants] = await Promise.all([
    Job.countDocuments({ postedBy: employerId }),
    Job.countDocuments({ postedBy: employerId, status: 'active' }),
    Job.countDocuments({ postedBy: employerId, status: 'closed' }),
    Application.countDocuments({ employer: employerId }),
  ]);

  const recentApplicants = await Application.find({ employer: employerId })
    .populate('applicant', 'name email avatar')
    .populate('job', 'title slug')
    .sort({ createdAt: -1 })
    .limit(10);

  const applicantsByJob = await Application.aggregate([
    { $match: { employer: employerId } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
    { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
    { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, jobId: '$job._id', title: '$job.title', count: 1 } },
  ]).limit(20);

  const upcomingInterviews = await Interview.find({ employer: employerId, scheduledDate: { $gte: new Date() } })
    .populate('applicant', 'firstName lastName email avatar')
    .populate('job', 'title')
    .populate('application')
    .sort({ scheduledDate: 1 })
    .limit(20);

  const recentNotifications = await Notification.find({ recipient: employerId, type: { $ne: 'new_message' } })
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplicants,
      recentApplicants,
      applicantsByJob,
      upcomingInterviews,
      recentNotifications,
    },
  });
});
