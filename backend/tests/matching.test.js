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
  const job = { skills: { technical: ['Java'], soft: [] } };
  const user = {
    technicalSkills: [],
    softSkills: ['Communication', 'Teamwork'],
    skillNames: ['Communication', 'Teamwork'],
  };

  const match = calculateJobMatch(job, user);

  assert.equal(match.details.skillScore, 0);
  assert.deepEqual(match.details.matchedSkills, []);
  assert.ok(!match.details.matchedSkills.includes('Communication'));
});

test('stored soft skills contribute a small bonus only when the job requires them', () => {
  const job = { skills: { technical: ['Java'], soft: ['Communication', 'Teamwork'] } };
  const user = { technicalSkills: ['Java'], softSkills: ['Communication'] };

  const match = calculateJobMatch(job, user);

  assert.equal(match.details.skillScore, 100);
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

// ---------------------------------------------------------------------------
// Regression: degenerate single-character normalizations ("C++" -> "c",
// "C#" -> "c") must never substring-match unrelated skills.
// ---------------------------------------------------------------------------

const cppJob = { skills: { technical: ['C++', 'C#', 'Mobile Android'], soft: [] } };
const softOnlyUser = { technicalSkills: ['Communication', 'Time Management'], softSkills: [] };

test('REG1: C++ and C# do NOT match a Communication/Time-Management profile', () => {
  const match = calculateJobMatch(cppJob, softOnlyUser);

  assert.deepEqual(match.details.matchedSkills, []);
  assert.deepEqual([...match.details.missingSkills].sort(), ['C#', 'C++', 'Mobile Android']);
  assert.equal(match.details.skillScore, 0);
});

test('REG2: C++ still matches C++ (exact normalization equality, not fuzzy)', () => {
  const match = calculateJobMatch({ skills: { technical: ['C++'], soft: [] } }, { technicalSkills: ['C++'] });

  assert.deepEqual(match.details.matchedSkills, ['C++']);
  assert.equal(match.details.skillScore, 100);
});

test('REG3: C# still matches C# (exact normalization equality, not fuzzy)', () => {
  const match = calculateJobMatch({ skills: { technical: ['C#'], soft: [] } }, { technicalSkills: ['C#'] });

  assert.deepEqual(match.details.matchedSkills, ['C#']);
  assert.equal(match.details.skillScore, 100);
});

test('REG4: JavaScript does not fuzzy-match Java via substring normalization', () => {
  const jobVsJsCv = calculateJobMatch({ skills: { technical: ['JavaScript'], soft: [] } }, { technicalSkills: ['Java'] });
  const jsJobVsJavaCv = calculateJobMatch({ skills: { technical: ['Java'], soft: [] } }, { technicalSkills: ['JavaScript'] });

  assert.deepEqual(jobVsJsCv.details.matchedSkills, []);
  assert.deepEqual(jsJobVsJavaCv.details.matchedSkills, []);
});

test('REG5: legitimate multi-character fuzzy matching still works', () => {
  const match = calculateJobMatch({ skills: { technical: ['PostgreSQL'], soft: [] } }, { technicalSkills: ['postgres'] });

  assert.deepEqual(match.details.matchedSkills, ['PostgreSQL']);
  assert.equal(match.details.skillScore, 100);
});

test('REG-guard: single-character normalized tokens never participate in fuzzy matching', () => {
  const match = calculateJobMatch({ skills: { technical: ['C'], soft: [] } }, { technicalSkills: ['Communication'] });

  assert.deepEqual(match.details.matchedSkills, []);
});

// ---------------------------------------------------------------------------
// Display tests: matchedSkills/missingSkills intersection + reason text
// ---------------------------------------------------------------------------

test('TEST1: Profile=[HTML,CSS,JavaScript,React] vs Job=[HTML,CSS,React,PHP] → matched=[HTML,CSS,React], missing=[PHP]', () => {
  const user = { technicalSkills: ['HTML', 'CSS', 'JavaScript', 'React'], softSkills: [] };
  const job = { skills: { technical: ['HTML', 'CSS', 'React', 'PHP'], soft: [] } };

  const match = calculateJobMatch(job, user);

  assert.deepEqual([...match.matchedSkills].sort(), ['CSS', 'HTML', 'React']);
  assert.deepEqual([...match.missingSkills].sort(), ['PHP']);
  assert.ok(match.details.skillScore > 0);
});

test('TEST2: Profile=[Communication,Time Management] vs Job=[C++,C#,Mobile Android] → matched=[], missing=[C++,C#,Mobile Android]', () => {
  const user = { technicalSkills: ['Communication', 'Time Management'], softSkills: [] };
  const job = { skills: { technical: ['C++', 'C#', 'Mobile Android'], soft: [] } };

  const match = calculateJobMatch(job, user);

  assert.deepEqual(match.matchedSkills, []);
  assert.deepEqual([...match.missingSkills].sort(), ['C#', 'C++', 'Mobile Android']);
  assert.equal(match.details.skillScore, 0);
});

test('TEST-reason-matched: reason lists matched skills when present', () => {
  const user = { technicalSkills: ['HTML', 'CSS', 'JavaScript', 'React'], softSkills: [] };
  const job = { skills: { technical: ['HTML', 'CSS', 'React', 'PHP'], soft: [] } };

  const match = calculateJobMatch(job, user);

  assert.ok(match.reason.startsWith('Matched skills:'));
  assert.ok(match.reason.includes('HTML'));
  assert.ok(match.reason.includes('CSS'));
  assert.ok(match.reason.includes('React'));
  assert.ok(!match.reason.includes('PHP'));
});

test('TEST-reason-empty: reason says no profile skills match when matchedSkills is empty', () => {
  const user = { technicalSkills: ['Communication', 'Time Management'], softSkills: [] };
  const job = { skills: { technical: ['C++', 'C#'], soft: [] } };

  const match = calculateJobMatch(job, user);

  assert.equal(match.reason, 'No skills from your profile match this job yet.');
});

test('TEST8-parity: calculateJobMatch returns matchedSkills identically at top level and in details', () => {
  const user = { technicalSkills: ['HTML', 'CSS', 'React'], softSkills: [] };
  const job = { skills: { technical: ['HTML', 'CSS', 'React', 'PHP'], soft: [] } };

  const match = calculateJobMatch(job, user);

  assert.deepEqual(match.matchedSkills, match.details.matchedSkills);
  assert.deepEqual(match.missingSkills, match.details.missingSkills);
});
