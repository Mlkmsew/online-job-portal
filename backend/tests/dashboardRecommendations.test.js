const test = require('node:test');
const assert = require('node:assert/strict');
const { canRecommendJobs, buildCvMatchingProfile } = require('../utils/dashboardHelpers');

// A well-formed analysis of the CURRENT uploaded CV.
const cvAAnalysis = {
  cvId: 'ethiojob/cvs/cv-a',
  skillNames: ['HTML', 'CSS', 'React', 'JavaScript'],
  experienceYears: 3,
  education: ['BSc Computer Science'],
  professionalTitle: 'Frontend Developer',
};

test('allows recommendations when a CV is uploaded with a matching parsed analysis', () => {
  const user = { cv: 'https://res.cloudinary.com/x/cvs/cv-a.pdf', cvPublicId: 'ethiojob/cvs/cv-a', resumeAnalysis: cvAAnalysis };
  assert.equal(canRecommendJobs(user), true);
});

test('does not allow recommendations when a CV is uploaded but parsing failed (no analysis)', () => {
  const user = { cv: 'https://res.cloudinary.com/x/cvs/cv-a.pdf', cvPublicId: 'ethiojob/cvs/cv-a', resumeAnalysis: {} };
  assert.equal(canRecommendJobs(user), false);
});

test('does not allow recommendations from profile skills alone', () => {
  const user = {
    technicalSkills: ['React'],
    softSkills: ['Teamwork'],
    skillNames: ['React', 'Teamwork'],
  };
  assert.equal(canRecommendJobs(user), false);
});

test('does not allow recommendations from profile experience alone', () => {
  const user = { experienceYears: 5, experienceDetails: [{ title: 'Dev' }] };
  assert.equal(canRecommendJobs(user), false);
});

test('does not allow a Resume Builder document to substitute for an uploaded CV', () => {
  const user = {
    technicalSkills: ['React'],
    // legacy second argument is no longer honored
  };
  assert.equal(canRecommendJobs(user, { _id: 'resume-doc' }), false);
});

test('does not allow recommendations after CV removal even with profile data and builder docs', () => {
  const user = {
    skillNames: ['React', 'Node.js'],
    technicalSkills: ['React'],
    softSkills: ['Teamwork'],
    experienceYears: 4,
    educationDetails: [{ degree: 'BSc' }],
    cvDetachedAt: new Date(),
  };
  assert.equal(canRecommendJobs(user, { _id: 'resume-doc' }), false);
});

test('does not allow recommendations when analysis belongs to a previous CV (stale identity)', () => {
  const user = {
    cv: 'https://res.cloudinary.com/x/cvs/cv-b.pdf',
    cvPublicId: 'ethiojob/cvs/cv-b',
    resumeAnalysis: { ...cvAAnalysis }, // cvId still points at CV A
  };
  assert.equal(canRecommendJobs(user), false);
});

test('buildCvMatchingProfile exposes only CV data — profile fields never leak in', () => {
  const user = {
    _id: 'u1',
    technicalSkills: ['Go', 'Rust'],           // profile-only noise
    softSkills: ['Leadership'],
    bio: 'Go developer',
    headline: 'Systems Engineer',
    experienceDetails: [{ title: 'Dev' }],
    educationDetails: [{ degree: 'PhD' }],
    certificates: [{ name: 'CEH' }],
    jobPreferences: { preferredJobTypes: ['Contract'] },
    resumeAnalysis: cvAAnalysis,
  };

  const profile = buildCvMatchingProfile(user);

  assert.deepEqual(profile.technicalSkills, ['HTML', 'CSS', 'React', 'JavaScript']);
  assert.equal(profile.bio, '');
  assert.equal(profile.headline, 'Frontend Developer'); // from the CV, not the profile
  assert.deepEqual(profile.softSkills, []);
  assert.deepEqual(profile.experienceDetails, []);
  assert.notEqual(profile.educationDetails[0].degree, 'PhD');
  assert.deepEqual(profile.certificates, []); // no CV certifications in this analysis
  assert.ok(profile.__cvOnlyProfile);
});
