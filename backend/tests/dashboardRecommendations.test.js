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

test('does not allow recommendations from profile experience alone', () => {
  const user = {
    experienceYears: 5,
    technicalSkills: ['React'],
    softSkills: ['Teamwork'],
  };

  assert.equal(canRecommendJobs(user), false);
});

test('does not allow recommendations after CV removal even with profile skills, experience and a Resume Builder CV', () => {
  // State right after DELETE /auth/upload-cv: parsed-CV cache cleared,
  // cvDetachedAt set, profile fields and Resume Builder docs still present.
  const user = {
    skillNames: ['React', 'Node.js'],
    technicalSkills: ['React'],
    softSkills: ['Teamwork'],
    experienceYears: 4,
    educationDetails: [{ degree: 'BSc' }],
    cvDetachedAt: new Date(),
  };
  const resumeBuilderDoc = { _id: 'resume-doc-1' };

  assert.equal(canRecommendJobs(user, resumeBuilderDoc), false);
});

test('allows recommendations again after uploading a new CV following removal', () => {
  const user = {
    cv: 'https://res.cloudinary.com/example/cvs/new-cv.pdf',
    cvDetachedAt: new Date(),
    skills: [],
  };
  const resumeBuilderDoc = { _id: 'resume-doc-1' };

  assert.equal(canRecommendJobs(user, resumeBuilderDoc), true);
});