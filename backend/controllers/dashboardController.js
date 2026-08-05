const { asyncHandler } = require('../utils/helpers');
const User = require('../models/user');
const Interview = require('../models/Interview');
const { Message } = require('../models/Message');
const Notification = require('../models/Notification');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Bookmark = require('../models/Bookmark');
const Application = require('../models/Application');
const { calculateJobMatch, calculateMatchScore } = require('../utils/matching');
const { canRecommendJobs } = require('../utils/dashboardHelpers');
const mongoose = require('mongoose');

// @desc Get job seeker dashboard
// @route GET /api/dashboard
// @access Private
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  console.log('Dashboard API called for user:', userId);
  console.log('Dashboard API auth header present:', Boolean(req.headers.authorization));

  const [user, unreadMessages, unreadNotifications, upcomingInterviews] = await Promise.all([
    User.findById(userId).select('-password'),
    // unread messages where current user is receiver
    Message.countDocuments({ receiver: userId, isRead: false }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Interview.find({ applicant: userId, scheduledDate: { $gte: new Date() } }).sort({ scheduledDate: 1 }).limit(10),
  ]);

  // Recommended jobs: build recommendations when the user has profile skills or a resume available.
  let recommended = [];
  const canRecommend = canRecommendJobs(user);

  if (canRecommend) {
    try {
      const jobs = await Job.find({ status: 'active', isApproved: true })
        .populate('company', 'name logo')
        .populate('skillsRequired', 'name');

      recommended = jobs
        .map((job) => {
          const match = calculateJobMatch(job, user);
          const { score, details, why } = match;
          return {
            ...job.toObject(),
            matchPercentage: score,
            matchDetails: details,
            matchReasons: why,
          };
        })
        .sort((a, b) => b.matchPercentage - a.matchPercentage || new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);
    } catch (error) {
      console.error('Dashboard recommendation generation failed:', error);
      recommended = [];
    }
  }

  if (!canRecommend) {
    recommended = [];
  }

  // Recently applied jobs
  const recentApplications = await Application.find({ applicant: userId })
    .populate('job', 'title slug company')
    .sort({ appliedAt: -1 })
    .limit(6);

  // Saved jobs
  const saved = await Bookmark.find({ user: userId }).populate('job', 'title slug company').limit(10);

  // Active, approved jobs for the seeker dashboard
  const dashboardJobs = await Job.find({
    status: 'active',
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('company', 'name logo')
    .populate('category', 'name');
  console.log('Dashboard jobs fetched:', dashboardJobs.length, 'jobs');

  // Resume & certificates info
  const resume = { hasCV: !!user.cv, cvUrl: user.cv, cvOriginalName: user.cvOriginalName };
  const certificates = user.certificates || [];

  // Skill stats
  const skillCount = (user.skills || []).length;

  // Application graph (last 30 days)
  const since = new Date();
  since.setDate(since.getDate() - 29);

  const appAgg = await Application.aggregate([
    { $match: { applicant: new mongoose.Types.ObjectId(userId), createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build series for last 30 days
  const series = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const found = appAgg.find((a) => a._id === key);
    series.push({ date: key, count: found ? found.count : 0 });
  }

  console.log('Dashboard response preparing jobs:', dashboardJobs.length);
  res.status(200).json({
    success: true,
    data: {
      profileCompleteness: user.profileCompleteness || 0,
      upcomingInterviews,
      unreadMessages,
      unreadNotifications,
      recommendedJobs: recommended,
      jobs: dashboardJobs,
      dashboardJobs,
      entryJobs: dashboardJobs,
      recentApplications,
      savedJobs: saved,
      resume,
      certificates,
      skillCount,
      applicationGraph: series,
    },
  });
});

// Export
module.exports = exports;
