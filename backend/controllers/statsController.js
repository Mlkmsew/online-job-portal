// ============================================
// Stats Controller (Public)
// ============================================
const User = require('../models/user');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Category = require('../models/Category');
const Job = require('../models/job');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get live community/platform counts for the public home page
// @route   GET /api/stats/community
// @access  Public
exports.getCommunityStats = asyncHandler(async (req, res) => {
  const [jobSeekers, companies, activeJobs, applications, categories] = await Promise.all([
    User.countDocuments({ role: 'jobseeker' }),
    Company.countDocuments(),
    Job.countDocuments({ status: 'active', isApproved: true }),
    Application.countDocuments(),
    Category.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: { jobSeekers, companies, activeJobs, applications, categories },
  });
});