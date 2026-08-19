const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateJobMatch } = require('../utils/matching');

test('technical skills drive the technical skill match score', () => {
  const job = { skills: { technical: ['Java'], soft: [] } };
  const user = { technicalSkills: ['Java'], softSkills: ['Communication'] };

  const match = calculateJobMatch(job, user);

  assert.equal(match.details.skillScore, 100);
  assert.deepEqual(match.details.matchedSkills, ['Java']);
});

test('soft skills are never treated as technical skills, even via legacy skillNames fallback', () => {
  // User has NO technical skills but has soft skills stored and mirrored into
  // skillNames (the backend keeps skillNames as the union of both categories).
  const job = { skills: { technical: ['Java'], soft: [] } };
  const user = {
    technicalSkills: [],
    softSkills: ['Communication', 'Teamwork'],
    skillNames: ['Communication', 'Teamwork'],
  };

  const match = calculateJobMatch(job, user);

  // The soft skills must not count as a technical match for "Java".
  assert.equal(match.details.skillScore, 0);
  assert.deepEqual(match.details.matchedSkills, []);
  assert.ok(!match.details.matchedSkills.includes('Communication'));
});

test('stored soft skills contribute a small bonus only when the job requires them', () => {
  const job = { skills: { technical: ['Java'], soft: ['Communication', 'Teamwork'] } };
  const user = { technicalSkills: ['Java'], softSkills: ['Communication'] };

  const match = calculateJobMatch(job, user);

  assert.equal(match.details.skillScore, 100); // capped at 100
  assert.deepEqual(match.details.matchedSkills, ['Java']);
  assert.deepEqual(match.details.softMatchedSkills, ['Communication']);
});

test('soft skills alone do not inflate the technical match score when job has no soft requirements', () => {
  const job = { skills: { technical: ['Java', 'Python'], soft: [] } };
  const user = { technicalSkills: [], softSkills: ['Communication'], skillNames: ['Communication'] };

  const match = calculateJobMatch(job, user);

  assert.equal(match.details.skillScore, 0);
  assert.deepEqual(match.details.matchedSkills, []);
  assert.deepEqual(match.details.softMatchedSkills, []);
});

test('categorized technical skills take precedence over legacy skillNames', () => {
  // Legacy user: skillNames holds everything, but the categorized technical
  // list is authoritative once present.
  const job = { skills: { technical: ['React', 'Node.js'], soft: [] } };
  const user = {
    technicalSkills: ['React', 'Node.js'],
    softSkills: ['Communication'],
    skillNames: ['React', 'Node.js', 'Communication'],
  };

  const match = calculateJobMatch(job, user);

  assert.equal(match.details.skillScore, 100);
  assert.deepEqual(match.details.matchedSkills, ['React', 'Node.js']);
});