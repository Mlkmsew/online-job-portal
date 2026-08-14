const test = require('node:test');
const assert = require('node:assert/strict');
const { canRecommendJobs } = require('../utils/dashboardHelpers');

test('does not allow recommendations when a user has profile skills but no uploaded CV', () => {
  const user = {
    skills: [{ _id: 'skill-1' }],
    resumeAnalysis: { skills: [] },
  };

  assert.equal(canRecommendJobs(user), false);
});

test('allows recommendations when a user has uploaded a CV', () => {
  const user = {
    cv: 'https://res.cloudinary.com/example/cvs/curriculum.pdf',
    skills: [],
    resumeAnalysis: { skills: [] },
  };

  assert.equal(canRecommendJobs(user), true);
});

test('does not allow recommendations when a user has no profile data', () => {
  const user = {
    skills: [],
    resumeAnalysis: { skills: [] },
  };

  assert.equal(canRecommendJobs(user), false);
});