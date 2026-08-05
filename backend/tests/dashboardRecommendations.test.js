const test = require('node:test');
const assert = require('node:assert/strict');
const { canRecommendJobs } = require('../utils/dashboardHelpers');

test('allows recommendations when a user has profile skills but no uploaded CV', () => {
  const user = {
    skills: [{ _id: 'skill-1' }],
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
