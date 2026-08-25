const test = require('node:test');
const assert = require('node:assert/strict');
const { hasProfileOrResumeData, buildCombinedResumeProfile } = require('../utils/dashboardHelpers');

test('allows recommendations when profile has technical skills', () => {
  const user = { technicalSkills: ['React'] };
  assert.equal(hasProfileOrResumeData(user), true);
});

test('allows recommendations when profile has experience', () => {
  const user = { experienceYears: 5, experienceDetails: [{ title: 'Dev' }] };
  assert.equal(hasProfileOrResumeData(user), true);
});

test('allows recommendations when profile has education', () => {
  const user = { educationDetails: [{ degree: 'BSc' }] };
  assert.equal(hasProfileOrResumeData(user), true);
});

test('allows recommendations when profile has a headline/title', () => {
  const user = { headline: 'Frontend Developer' };
  assert.equal(hasProfileOrResumeData(user), true);
});

test('does not allow recommendations when profile is empty', () => {
  const user = {};
  assert.equal(hasProfileOrResumeData(user), false);
});

test('does not allow recommendations for null user', () => {
  assert.equal(hasProfileOrResumeData(null), false);
});

test('allows recommendations with Resume Builder skills combined with profile', () => {
  const user = { technicalSkills: ['React'] };
  const resumeDoc = { skills: [{ name: 'Node.js' }], softSkills: [] };
  const profile = buildCombinedResumeProfile(user, resumeDoc);
  assert.ok(profile.technicalSkills.includes('React'), 'profile skill preserved');
  assert.ok(profile.technicalSkills.includes('Node.js'), 'Resume Builder skill added');
  assert.equal(hasProfileOrResumeData(profile), true);
});

test('Resume Builder title fills in missing profile headline', () => {
  const user = {};
  const resumeDoc = { profile: { title: 'Backend Developer' } };
  const profile = buildCombinedResumeProfile(user, resumeDoc);
  assert.equal(profile.headline, 'Backend Developer');
  assert.equal(profile.currentRole, 'Backend Developer');
});

test('profile headline takes precedence over Resume Builder title', () => {
  const user = { headline: 'Full Stack Dev' };
  const resumeDoc = { profile: { title: 'Backend Developer' } };
  const profile = buildCombinedResumeProfile(user, resumeDoc);
  assert.equal(profile.headline, 'Full Stack Dev');
});

test('Resume Builder experience fills in when profile experience is empty', () => {
  const user = {};
  const resumeDoc = { experience: [{ title: 'Dev 1' }, { title: 'Dev 2' }] };
  const profile = buildCombinedResumeProfile(user, resumeDoc);
  assert.equal(profile.experienceYears, 2);
});

test('profile experienceYears takes precedence over Resume Builder', () => {
  const user = { experienceYears: 5 };
  const resumeDoc = { experience: [{ title: 'Dev 1' }] };
  const profile = buildCombinedResumeProfile(user, resumeDoc);
  assert.equal(profile.experienceYears, 5);
});

test('Resume Builder education fills in when profile education is empty', () => {
  const user = {};
  const resumeDoc = { education: [{ degree: 'BSc', institution: 'AAU' }] };
  const profile = buildCombinedResumeProfile(user, resumeDoc);
  assert.equal(profile.educationDetails.length, 1);
  assert.equal(profile.educationDetails[0].degree, 'BSc');
});

test('combined profile excludes bio, jobPreferences, careerInterests', () => {
  const user = {
    bio: 'Must not leak',
    jobPreferences: { preferredJobTypes: ['Contract'] },
    careerInterests: ['Healthcare'],
  };
  const profile = buildCombinedResumeProfile(user, null);
  assert.equal(profile.bio, '');
  assert.deepEqual(profile.jobPreferences, {});
  assert.deepEqual(profile.careerInterests, []);
});

test('combined profile excludes resumeAnalysis', () => {
  const user = {
    resumeAnalysis: { skills: ['Hacked'], professionalTitle: 'Hacker' },
  };
  const profile = buildCombinedResumeProfile(user, null);
  assert.equal(profile.resumeAnalysis, undefined);
  assert.ok(!profile.technicalSkills.includes('Hacked'));
});

test('null user returns source none', () => {
  assert.equal(hasProfileOrResumeData(null), false);
});
