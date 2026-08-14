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
    Interview.find({ applicant: userId, scheduledDate: { $gte: new Date() }, status: { $nin: ['completed', 'cancelled'] } })
      .sort({ scheduledDate: 1 })
      .limit(10)
      .populate('company', 'name logo')
      .populate('job', 'title')
      .populate('employer', 'firstName lastName'),
  ]);

  // Recommended jobs: build recommendations based on match scoring engine
  let recommended = [];
  try {
    const appliedJobIds = new Set(
      (await Application.find({ applicant: userId }).select('job')).map((app) => app.job?.toString()).filter(Boolean)
    );

    const jobs = await Job.find({ status: { $in: ['published', 'active'] }, isApproved: true })
      .populate('company', 'name logo location')
      .populate('skillsRequired', 'name')
      .sort({ createdAt: -1 });

    const unappliedJobs = jobs.filter((j) => !appliedJobIds.has(j._id.toString()));

    const scoredJobs = unappliedJobs.map((job) => {
      const match = calculateJobMatch(job, user);
      const score = match.matchScore ?? match.score ?? 0;
      return {
        ...job.toObject(),
        jobId: job._id.toString(),
        matchPercentage: score,
        matchScore: score,
        matchedSkills: match.matchedSkills || [],
        missingSkills: match.missingSkills || [],
        matchReasons: match.why || [],
        reason: match.reason || '',
        matchDetails: match.details || {},
      };
    });

    let filtered = scoredJobs.filter((j) => j.matchScore >= 40);
    if (filtered.length < 2) {
      filtered = scoredJobs;
    }

    recommended = filtered
      .sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  } catch (error) {
    console.error('Dashboard recommendation generation failed:', error);
    recommended = [];
  }

  // Recently applied jobs
  const recentApplications = await Application.find({ applicant: userId })
    .populate('job', 'title slug company')
    .sort({ appliedAt: -1 })
    .limit(6);

  // Saved jobs
  const saved = await Bookmark.find({ user: userId }).populate('job', 'title slug company').limit(10);

  // Active, approved jobs for the seeker dashboard — recently posted and
  // ranked by how well they match the job seeker's profile.
  const recentJobs = await Job.find({
    status: { $in: ['published', 'active'] },
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('company', 'name logo')
    .populate('category', 'name');

  const dashboardJobs = recentJobs
    .map((job) => {
      const match = calculateJobMatch(job, user);
      return { job, score: match.matchScore ?? 0 };
    })
    .sort((a, b) => b.score - a.score || new Date(b.job.createdAt) - new Date(a.job.createdAt))
    .slice(0, 3)
    .map(({ job }) => job);
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
      profileComplete: (user.profileCompleteness || 0) >= 70,
      canRecommend: canRecommendJobs(user),
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
