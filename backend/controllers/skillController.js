// ============================================
// Skill Controller (Public)
// ============================================
const Skill = require('../models/Skill');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
exports.getSkills = asyncHandler(async (req, res) => {
  const query = { isActive: true };
  if (req.query.category) query.category = req.query.category;
  if (req.query.search) query.name = new RegExp(req.query.search, 'i');

  const skills = await Skill.find(query).sort('name').limit(100);
  res.status(200).json({ success: true, count: skills.length, data: skills });
});

module.exports = exports;
