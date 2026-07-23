const { asyncHandler } = require('../utils/helpers');
const User = require('../models/user');
const Interview = require('../models/Interview');
const { Message } = require('../models/Message');
const Notification = require('../models/Notification');
const Job = require('../models/Job');
const Bookmark = require('../models/Bookmark');
const Application = require('../models/Application');
const mongoose = require('mongoose');

// @desc Get job seeker dashboard
// @route GET /api/dashboard
// @access Private
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, unreadMessages, unreadNotifications, upcomingInterviews] = await Promise.all([
    User.findById(userId).select('-password'),
    // unread messages where current user is receiver
    Message.countDocuments({ receiver: userId, isRead: false }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Interview.find({ applicant: userId, scheduledDate: { $gte: new Date() } }).sort({ scheduledDate: 1 }).limit(10),
  ]);

  // Recommended jobs: match by skills and calculate percentage
  let recommended = [];
  const userSkillIds = (user.skills || []).map((s) => (s._id ? s._id.toString() : s.toString()));
  if (user && userSkillIds.length) {
    const jobs = await Job.find({ skillsRequired: { $in: userSkillIds }, status: 'active' })
      .populate('company', 'name logo')
      .populate('skillsRequired', 'name')
      .sort({ createdAt: -1 })
      .limit(16);

    recommended = jobs
      .map((job) => {
        const requiredIds = (job.skillsRequired || []).map((skill) => skill._id.toString());
        const matchedCount = requiredIds.filter((skillId) => userSkillIds.includes(skillId)).length;
        const percentage = requiredIds.length ? Math.round((matchedCount / requiredIds.length) * 100) : 0;
        return {
          ...job.toObject(),
          matchPercentage: percentage,
          matchedSkillsCount: matchedCount,
          requiredSkillsCount: requiredIds.length,
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  }

  // Recently applied jobs
  const recentApplications = await Application.find({ applicant: userId })
    .populate('job', 'title slug company')
    .sort({ appliedAt: -1 })
    .limit(6);

  // Saved jobs
  const saved = await Bookmark.find({ user: userId }).populate('job', 'title slug company').limit(10);

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

  res.status(200).json({
    success: true,
    data: {
      profileCompleteness: user.profileCompleteness || 0,
      upcomingInterviews,
      unreadMessages,
      unreadNotifications,
      recommendedJobs: recommended,
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
