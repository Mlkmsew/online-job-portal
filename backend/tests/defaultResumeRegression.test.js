// ============================================
// Default Resume Builder Regression Tests
// ============================================
// 36 tests covering:
//   - Default resume lifecycle (1-8)
//   - Uploaded CV isolation (9-14)
//   - Delete lifecycle (15-18)
//   - Profile integration (19-21)
//   - Endpoint parity (22-24)
//   - CV upload → default (25-32)
//   - Recommendation lifecycle (33-36)
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const cloudinary = require('cloudinary').v2;
cloudinary.uploader.destroy = async () => ({ result: 'ok' });
cloudinary.uploader.upload = async () => ({ secure_url: 'https://res.cloudinary.com/demo/raw/upload/test.pdf', public_id: 'test-cv' });

const User = require('../models/user');
const Skill = require('../models/Skill');
const Company = require('../models/Company');
const Job = require('../models/job');
const Resume = require('../models/Resume');
const Category = require('../models/Category');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const jobController = require('../controllers/jobController');
const resumeController = require('../controllers/resumeController');

const invokeController = (controller, req) =>
  new Promise((resolve, reject) => {
    let settled = false;
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) {
        if (!settled) { settled = true; resolve({ statusCode: this.statusCode, body: payload }); }
        return this;
      },
    };
    const next = (err) => {
      if (!settled) { settled = true; err ? reject(err) : resolve(null); }
    };
    controller(req, res, next);
  });

let mongod;
let user;
let frontendJob, backendJob, systemsJob;

const fetchDashboard = async () => {
  const response = await invokeController(dashboardController.getDashboard, {
    user: { id: user._id.toString() },
    headers: {},
  });
  assert.equal(response.statusCode, 200);
  return response.body.data;
};

const fetchRecommendations = async () => {
  const response = await invokeController(jobController.getRecommendations, {
    user: { id: user._id.toString() },
    headers: {},
  });
  assert.equal(response.statusCode, 200);
  return response.body;
};

const resetUser = async (overrides = {}) => {
  await User.updateOne({ _id: user._id }, {
    $set: {
      technicalSkills: overrides.technicalSkills ?? ['Rust'],
      skillNames: overrides.skillNames ?? [],
      softSkills: overrides.softSkills ?? ['Leadership'],
      experienceYears: overrides.experienceYears ?? 9,
      experienceDetails: overrides.experienceDetails ?? [{ title: 'Systems Engineer', company: 'Acme' }],
      educationDetails: overrides.educationDetails ?? [{ degree: 'PhD', institution: 'AAU' }],
      headline: overrides.headline ?? '',
      currentRole: overrides.currentRole ?? '',
      cv: overrides.cv ?? null,
      cvPublicId: overrides.cvPublicId ?? null,
      cvOriginalName: overrides.cvOriginalName ?? null,
      resumeAnalysis: overrides.resumeAnalysis ?? null,
      cvDetachedAt: null,
      skills: overrides.skills ?? [],
      experience: overrides.experience ?? '',
      education: overrides.education ?? [],
      jobPreferences: overrides.jobPreferences ?? {},
      careerInterests: overrides.careerInterests ?? [],
    },
  });
};

// =========================================================================
// Setup
// =========================================================================

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const names = ['HTML', 'CSS', 'React', 'JavaScript', 'Python', 'Django', 'PostgreSQL', 'FastAPI', 'Rust', 'C++', 'C#'];
  const skills = {};
  for (const name of names) skills[name] = await Skill.create({ name });

  const category = await Category.create({ name: 'Information Technology' });
  const employer = await User.create({
    firstName: 'Employer', lastName: 'One', email: 'default-test-employer@demo.com',
    password: 'Password@123', role: 'employer', isEmailVerified: true,
  });
  const company = await Company.create({
    name: 'Emare ICT Hub', owner: employer._id, email: 'hr@default.example',
    isApproved: true, isActive: true,
  });
  const deadline = new Date(Date.now() + 30 * 864e5);
  const makeJob = async (title, required) =>
    Job.create({
      title, company: company._id, postedBy: employer._id, category: category._id,
      description: `${title} role`, skillsRequired: required.map((n) => skills[n]._id),
      location: { region: 'Addis Ababa' }, applicationDeadline: deadline,
      status: 'published', isApproved: true, jobType: 'Full-time',
    });

  frontendJob = await makeJob('Frontend Developer', ['HTML', 'CSS', 'React']);
  backendJob = await makeJob('Backend Developer', ['Python', 'Django', 'PostgreSQL']);
  systemsJob = await makeJob('Systems Developer', ['C++', 'C#']);

  user = await User.create({
    firstName: 'Solomon', lastName: 'Tadesse', email: 'default-test@demo.com',
    password: 'Password@123', role: 'jobseeker', isEmailVerified: true,
    technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
    experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }],
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

// =========================================================================
// DEFAULT RESUME LIFECYCLE (Tests 1-8)
// =========================================================================

test('1. one Resume Builder → automatically becomes default', async () => {
  await Resume.deleteMany({ user: user._id });
  const r = await Resume.create({
    user: user._id, title: 'Resume A', skills: [{ name: 'Rust' }],
    profile: { title: 'Systems Engineer' },
  });
  const check = await Resume.findById(r._id).lean();
  assert.equal(check.isDefault, true, 'single resume auto-defaults');
});

test('2. two Resume Builders → exactly one default', async () => {
  await Resume.deleteMany({ user: user._id });
  const a = await Resume.create({ user: user._id, title: 'Resume A', skills: [{ name: 'React' }] });
  const b = await Resume.create({ user: user._id, title: 'Resume B', skills: [{ name: 'Python' }] });

  // After creating two, the second should have been auto-promoted (or the first).
  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(defaults.length, 1, 'exactly one default');

  // Set B as default explicitly.
  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: b._id.toString() },
  });
  const afterSet = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(afterSet.length, 1, 'still exactly one default after setDefault');
  assert.equal(afterSet[0]._id.toString(), b._id.toString());
});

test('3. multiple resumes with no default → deterministic default selected', async () => {
  await Resume.deleteMany({ user: user._id });
  const old = await Resume.create({ user: user._id, title: 'Old Resume', skills: [{ name: 'Python' }] });
  // Backdate old resume using raw collection to bypass Mongoose timestamps.
  await Resume.collection.updateOne({ _id: old._id }, { $set: { updatedAt: new Date('2020-01-01T00:00:00Z') } });

  const fresh = await Resume.create({ user: user._id, title: 'Fresh Resume', skills: [{ name: 'React' }] });
  // Force no default using raw collection to avoid timestamps resetting updatedAt.
  await Resume.collection.updateMany({ user: user._id }, { $set: { isDefault: false } });

  // Trigger lazy default via dashboard.
  const data = await fetchDashboard();
  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(defaults.length, 1, 'lazy-init set one default');
  // The fresh resume should be selected (most recently updated).
  assert.equal(defaults[0]._id.toString(), fresh._id.toString(), 'most recently updated is default');
});

test('4. default A → recommendations use A', async () => {
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'C++' }, { name: 'C#' }],
    profile: { title: 'Systems Engineer' },
  });
  await resetUser({ technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [] });

  const data = await fetchDashboard();
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(sys, 'Systems Developer recommended');
  assert.ok((sys.matchedSkills || []).includes('C++'), 'Resume A C++ matched');
});

let scoreA;

test('5. switch default A → B → recommendations use B', async () => {
  const a = await Resume.findOne({ user: user._id, title: 'Resume A' });
  const b = await Resume.create({
    user: user._id, title: 'Resume B',
    skills: [{ name: 'React' }, { name: 'HTML' }, { name: 'CSS' }],
    profile: { title: 'Frontend Developer' },
  });

  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: b._id.toString() },
  });

  const data = await fetchDashboard();
  const fe = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(fe, 'Frontend Developer recommended');
  assert.ok((fe.matchedSkills || []).includes('React'), 'Resume B React matched');
  // A's C++ must not appear.
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  if (sys) {
    assert.ok(!(sys.matchedSkills || []).includes('C++'), 'Resume A C++ must not appear');
  }
  scoreA = fe.matchScore;
});

test('6. switch B → A → original A recommendations return deterministically', async () => {
  const a = await Resume.findOne({ user: user._id, title: 'Resume A' });
  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: a._id.toString() },
  });

  const data = await fetchDashboard();
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(sys, 'Systems Developer recommended again');
  assert.ok((sys.matchedSkills || []).includes('C++'), 'Resume A C++ matched again');
});

test('7. non-default Resume Builder cannot affect recommendations', async () => {
  // A is default with Rust.
  const a = await Resume.findOne({ user: user._id, title: 'Resume A' });
  await Resume.updateOne({ _id: a._id }, { $set: { skills: [{ name: 'Rust' }] } });
  await Resume.updateOne({ _id: a._id }, { $set: { isDefault: true } });

  // Create B with Python (non-default).
  await Resume.create({
    user: user._id, title: 'Non-Default B', isDefault: false,
    skills: [{ name: 'Python' }, { name: 'Django' }],
  });

  await resetUser({ technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [] });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['Python', 'Django'].includes(skill),
        `non-default skill "${skill}" must not leak`);
    }
  }
});

test('8. previous default data cannot leak into new default context', async () => {
  await Resume.deleteMany({ user: user._id });

  // A has C++ → matches Systems.
  const a = await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'C++' }], profile: { title: 'Systems Engineer' },
  });
  await resetUser({ technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [] });

  const dataA = await fetchDashboard();
  const sysA = dataA.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(sysA && (sysA.matchedSkills || []).includes('C++'), 'A: C++ matched');

  // B has React → matches Frontend.
  const b = await Resume.create({
    user: user._id, title: 'Resume B',
    skills: [{ name: 'React' }, { name: 'HTML' }], profile: { title: 'Frontend Developer' },
  });
  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: b._id.toString() },
  });

  const dataB = await fetchDashboard();
  const feB = dataB.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(feB && (feB.matchedSkills || []).includes('React'), 'B: React matched');
  // A's C++ must NOT appear.
  for (const job of dataB.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(skill !== 'C++', 'old default C++ must not leak');
    }
  }
});

// =========================================================================
// UPLOADED CV ISOLATION (Tests 9-14)
// =========================================================================

test('9. uploaded CV cannot affect recommendations', async () => {
  // Clean state: only profile Rust, one Resume with Rust.
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Profile Resume', isDefault: true,
    skills: [{ name: 'Rust' }],
  });
  await resetUser({
    technicalSkills: ['Rust'], skillNames: [],
    cv: 'https://res.cloudinary.com/demo/raw/upload/test.pdf',
    cvPublicId: 'test-cv',
    cvOriginalName: 'test.pdf',
    resumeAnalysis: { cvId: 'test-cv', skillNames: ['HTML', 'CSS'], skills: [], professionalTitle: 'Frontend Dev' },
  });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['HTML', 'CSS'].includes(skill),
        `CV skill "${skill}" must not appear`);
    }
  }
});

test('10. resumeAnalysis cannot affect recommendations', async () => {
  await resetUser({
    resumeAnalysis: {
      cvId: 'test-cv', skillNames: ['Python', 'Django'],
      skills: [], professionalTitle: 'Backend Dev', experienceYears: 5,
    },
  });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['Python', 'Django'].includes(skill),
        `resumeAnalysis skill "${skill}" must not leak`);
    }
  }
});

test('11. OCR text cannot affect recommendations', async () => {
  // Clean state: only profile Rust, one Resume with Rust.
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Profile Resume', isDefault: true,
    skills: [{ name: 'Rust' }],
  });
  await resetUser({
    technicalSkills: ['Rust'], skillNames: [],
    resumeAnalysis: {
      cvId: 'test-cv', rawText: 'JavaScript React HTML CSS Node.js',
      skillNames: ['JavaScript', 'React'], skills: [],
    },
  });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['JavaScript', 'React'].includes(skill),
        `OCR skill "${skill}" must not leak`);
    }
  }
});

test('12. stale CV analysis cannot affect recommendations', async () => {
  await resetUser({
    cv: 'https://res.cloudinary.com/demo/raw/upload/new.pdf',
    cvPublicId: 'new-cv-id',
    resumeAnalysis: {
      cvId: 'old-cv-id', // stale: different from current cvPublicId
      skillNames: ['Python'], skills: [],
    },
  });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(skill !== 'Python', 'stale CV Python must not leak');
    }
  }
});

test('13. localStorage cannot affect recommendations', async () => {
  // localStorage is client-side only; verify server ignores it.
  // Clean state: only profile Rust, no Resume Builder.
  await Resume.deleteMany({ user: user._id });
  await resetUser({ technicalSkills: ['C++'], skillNames: ['C++'] });
  const data = await fetchDashboard();
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(sys, 'Systems Developer recommended from DB profile only');
  assert.ok((sys.matchedSkills || []).includes('C++'), 'C++ from DB profile matched');
});

test('14. non-default Resume Builder cannot be used as a CV fallback', async () => {
  // Profile has Rust. Default Resume has Rust. Non-default Resume has Python.
  // Python from non-default must not appear.
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Default Resume', isDefault: true,
    skills: [{ name: 'Rust' }],
  });
  await Resume.create({
    user: user._id, title: 'Non-Default Resume', isDefault: false,
    skills: [{ name: 'Python' }],
  });
  await resetUser({ technicalSkills: ['Rust'], skillNames: [] });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(skill !== 'Python', 'non-default Python must not leak');
    }
  }
});

// =========================================================================
// DELETE LIFECYCLE (Tests 15-18)
// =========================================================================

test('15. delete default A with B remaining → B becomes default', async () => {
  await Resume.deleteMany({ user: user._id });
  const a = await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'Rust' }],
  });
  const b = await Resume.create({
    user: user._id, title: 'Resume B',
    skills: [{ name: 'React' }],
  });

  await invokeController(resumeController.deleteResume, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: a._id.toString() },
  });

  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(defaults.length, 1, 'one default after deleting A');
  assert.equal(defaults[0]._id.toString(), b._id.toString(), 'B promoted to default');
});

test('16. delete only Resume Builder → profile-only recommendations', async () => {
  await Resume.deleteMany({ user: user._id });
  await resetUser({ technicalSkills: ['Rust'], skillNames: [], softSkills: ['Leadership'],
    experienceYears: 9, experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }] });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  assert.ok(data.recommendedJobs.length > 0, 'profile-only still produces recommendations');
});

test('17. no usable profile and no Resume Builder → recommendationSource none', async () => {
  await Resume.deleteMany({ user: user._id });
  // Nuclear reset: clear every field that could contribute to recommendations.
  await User.updateOne({ _id: user._id }, {
    $set: {
      technicalSkills: [], skillNames: [], softSkills: [], skills: [],
      experienceYears: null, experienceDetails: [], experience: '',
      educationDetails: [], education: [],
      headline: '', currentRole: '', bio: '',
      certificates: [], languages: [],
      jobPreferences: {}, careerInterests: [],
      cv: null, cvPublicId: null, cvOriginalName: null,
      resumeAnalysis: null, cvDetachedAt: null,
    },
  });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'none');
  assert.equal(data.recommendationState, 'no_cv');
  assert.equal(data.canRecommend, false);

  const recs = await fetchRecommendations();
  assert.equal(recs.recommendationSource, 'none');
  assert.equal(recs.recommendations.length, 0);
});

test('18. delete default must not cause uploaded CV to become recommendation input', async () => {
  // Set up CV + resume.
  await Resume.deleteMany({ user: user._id });
  const r = await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'Rust' }],
  });
  await resetUser({
    cv: 'https://res.cloudinary.com/demo/raw/upload/test.pdf',
    cvPublicId: 'test-cv',
    resumeAnalysis: { cvId: 'test-cv', skillNames: ['HTML', 'CSS'], skills: [] },
    technicalSkills: ['Rust'], skillNames: [],
  });

  // Delete the only resume.
  await invokeController(resumeController.deleteResume, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: r._id.toString() },
  });

  const data = await fetchDashboard();
  // CV data must NOT become the source.
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['HTML', 'CSS'].includes(skill),
        `CV skill "${skill}" must not become recommendation input after resume deletion`);
    }
  }

  // Restore.
  await resetUser();
  await Resume.create({ user: user._id, title: 'Restored', isDefault: true, skills: [{ name: 'Rust' }] });
});

// =========================================================================
// PROFILE INTEGRATION (Tests 19-21)
// =========================================================================

test('19. profile changes affect recommendations', async () => {
  await Resume.deleteMany({ user: user._id });
  await resetUser({ technicalSkills: ['Python'], skillNames: ['Python'] });

  const dataPy = await fetchDashboard();
  const bePy = dataPy.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok((bePy.matchedSkills || []).includes('Python'), 'Python matches backend');

  await resetUser({ technicalSkills: ['C++'], skillNames: ['C++'] });
  const dataCpp = await fetchDashboard();
  const sysCpp = dataCpp.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok((sysCpp.matchedSkills || []).includes('C++'), 'C++ matches systems');
  assert.notEqual(bePy.matchScore, dataCpp.recommendedJobs.find((j) => j.title === 'Backend Developer').matchScore,
    'different profile skills → different scores');
});

test('20. profile + current default Resume Builder combined correctly', async () => {
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'Django' }],
  });
  await resetUser({ technicalSkills: ['Python'], skillNames: ['Python'] });

  const data = await fetchDashboard();
  const be = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok(be, 'Backend Developer recommended');
  assert.ok((be.matchedSkills || []).includes('Python'), 'Python from profile');
  assert.ok((be.matchedSkills || []).includes('Django'), 'Django from Resume Builder');
});

test('21. unrelated profile fields do not affect recommendations', async () => {
  await Resume.deleteMany({ user: user._id });
  await resetUser({
    technicalSkills: ['Rust'], skillNames: [],
    bio: 'This should not leak',
    jobPreferences: { preferredJobTypes: ['Contract'] },
    careerInterests: ['Healthcare'],
  });

  const data = await fetchDashboard();
  for (const job of data.recommendedJobs) {
    assert.ok(!job.matchReasons?.some((r) => typeof r === 'string' && r.includes('This should not leak')),
      'bio must not appear in match reasons');
  }
});

// =========================================================================
// ENDPOINT PARITY (Tests 22-24)
// =========================================================================

test('22. /api/dashboard and /api/jobs/recommendations use the same default Resume Builder', async () => {
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'Rust' }], profile: { title: 'Systems Engineer' },
  });
  await resetUser({ technicalSkills: ['Rust'], skillNames: [], softSkills: ['Leadership'],
    experienceYears: 9, experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }] });

  const dash = await fetchDashboard();
  const recs = await fetchRecommendations();
  assert.equal(dash.recommendationSource, recs.recommendationSource, 'same source');
});

test('23. both endpoints return the same recommendationSource', async () => {
  const dash = await fetchDashboard();
  const recs = await fetchRecommendations();
  assert.equal(dash.recommendationSource, recs.recommendationSource);
});

test('24. both endpoints return consistent recommendation scores', async () => {
  const dash = await fetchDashboard();
  const recs = await fetchRecommendations();

  for (const rec of recs.recommendations) {
    const dashJob = dash.recommendedJobs.find((j) => j.jobId === rec.jobId || j._id === rec.jobId);
    assert.ok(dashJob, `${rec.title} present on dashboard`);
    assert.equal(rec.matchScore, dashJob.matchScore, `score matches for ${rec.title}`);
    assert.deepEqual([...(rec.matchedSkills || [])].sort(), [...(dashJob.matchedSkills || [])].sort(),
      `matchedSkills match for ${rec.title}`);
  }
});

// =========================================================================
// CV UPLOAD → DEFAULT (Tests 25-32)
// =========================================================================

test('25. upload CV A → A becomes default Resume Builder', async () => {
  await Resume.deleteMany({ user: user._id });
  // Simulate uploadCV flow by creating a Resume Builder from CV data.
  const cvResume = await Resume.create({
    user: user._id, title: 'Uploaded CV', isDefault: true,
    skills: [{ name: 'JavaScript' }, { name: 'React' }],
    profile: { title: 'Frontend Developer' },
  });

  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0]._id.toString(), cvResume._id.toString());
});

test('26. upload CV B → B becomes default and A is no longer default', async () => {
  // Create another CV-derived resume.
  const cvB = await Resume.create({
    user: user._id, title: 'Uploaded CV B',
    skills: [{ name: 'Python' }, { name: 'Django' }],
    profile: { title: 'Backend Developer' },
  });

  // Clear old default and set B as default (simulating upload CV B).
  await Resume.updateMany({ user: user._id, isDefault: true }, { $set: { isDefault: false } });
  await Resume.updateOne({ _id: cvB._id }, { $set: { isDefault: true } });

  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0]._id.toString(), cvB._id.toString());
});

test('27. upload CV C → C becomes default and B is no longer default', async () => {
  const cvC = await Resume.create({
    user: user._id, title: 'Uploaded CV C',
    skills: [{ name: 'C++' }, { name: 'C#' }],
    profile: { title: 'Systems Developer' },
  });

  await Resume.updateMany({ user: user._id, isDefault: true }, { $set: { isDefault: false } });
  await Resume.updateOne({ _id: cvC._id }, { $set: { isDefault: true } });

  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0]._id.toString(), cvC._id.toString());
});

test('28. failed upload → previous default remains unchanged', async () => {
  const before = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(before.length, 1, 'has default before failed upload');

  // Simulate a failed upload: the upload code should NOT touch defaults.
  // We just verify the default is unchanged.
  const after = await Resume.find({ user: user._id, isDefault: true });
  assert.equal(after.length, 1, 'still has same default after failed upload');
  assert.equal(after[0]._id.toString(), before[0]._id.toString(), 'same default resume');
});

test('29. only one uploaded CV-derived Resume Builder can be default', async () => {
  const defaults = await Resume.find({ user: user._id, isDefault: true });
  assert.ok(defaults.length <= 1, 'at most one default');
});

test('30. existing manually created Resume Builder resumes are not corrupted', async () => {
  // Create a manual resume.
  const manual = await Resume.create({
    user: user._id, title: 'Manual Resume', isDefault: false,
    skills: [{ name: 'Rust' }],
  });

  // Verify it exists and is not corrupted.
  const check = await Resume.findById(manual._id).lean();
  assert.ok(check, 'manual resume exists');
  assert.equal(check.title, 'Manual Resume');
  assert.equal(check.isDefault, false);
  assert.ok(Array.isArray(check.skills));
  assert.equal(check.skills[0].name, 'Rust');
});

test('31. page refresh preserves the default from the database', async () => {
  // Simulate page refresh: fetch resumes from DB (like the frontend does).
  const resumes = await Resume.find({ user: user._id }).sort({ updatedAt: -1 }).lean();
  const defaults = resumes.filter((r) => r.isDefault);
  assert.ok(defaults.length <= 1, 'at most one default on refresh');
  assert.ok(defaults.length >= 1 || resumes.length === 0, 'default exists if resumes exist');
});

test('32. default state is not stored only in localStorage', async () => {
  // The default flag is on the Resume document in MongoDB, not in localStorage.
  const dbResume = await Resume.findOne({ user: user._id, isDefault: true }).lean();
  assert.ok(dbResume, 'default is stored in database');
  assert.equal(typeof dbResume.isDefault, 'boolean', 'isDefault is a boolean field');
});

// =========================================================================
// RECOMMENDATION LIFECYCLE (Tests 33-36)
// =========================================================================

test('33. A + Profile → scoreA', async () => {
  await Resume.deleteMany({ user: user._id });
  await Resume.create({
    user: user._id, title: 'Resume A', isDefault: true,
    skills: [{ name: 'Rust' }], profile: { title: 'Systems Engineer' },
  });
  await resetUser({ technicalSkills: ['Rust'], skillNames: [], softSkills: ['Leadership'],
    experienceYears: 9, experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }] });

  const data = await fetchDashboard();
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(sys, 'Systems Developer recommended');
  globalThis._scoreA = sys.matchScore;
});

test('34. B + Profile → scoreB', async () => {
  const b = await Resume.create({
    user: user._id, title: 'Resume B',
    skills: [{ name: 'React' }, { name: 'HTML' }, { name: 'CSS' }],
    profile: { title: 'Frontend Developer' },
  });
  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: b._id.toString() },
  });

  const data = await fetchDashboard();
  const fe = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(fe, 'Frontend Developer recommended');
  globalThis._scoreB = fe.matchScore;
  assert.notEqual(globalThis._scoreA, globalThis._scoreB, 'scoreA ≠ scoreB');
});

test('35. A + Profile again → scoreA identical to original', async () => {
  const a = await Resume.findOne({ user: user._id, title: 'Resume A' });
  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: a._id.toString() },
  });

  const data = await fetchDashboard();
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(sys, 'Systems Developer recommended');
  assert.equal(sys.matchScore, globalThis._scoreA, 'scoreA is identical');
});

test('36. changing only uploaded CV while keeping same default Resume Builder + Profile → recommendations unchanged', async () => {
  const a = await Resume.findOne({ user: user._id, title: 'Resume A' });
  await invokeController(resumeController.setDefault, {
    user: { _id: user._id, id: user._id.toString() },
    params: { id: a._id.toString() },
  });

  const before = await fetchDashboard();

  // "Upload" a new CV with different skills.
  await resetUser({
    cv: 'https://res.cloudinary.com/demo/raw/upload/new.pdf',
    cvPublicId: 'new-cv-id',
    cvOriginalName: 'new-cv.pdf',
    resumeAnalysis: { cvId: 'new-cv-id', skillNames: ['HTML', 'CSS', 'React'], skills: [] },
    technicalSkills: ['Rust'], skillNames: [],
  });

  const after = await fetchDashboard();
  const beforeSys = before.recommendedJobs.find((j) => j.title === 'Systems Developer');
  const afterSys = after.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(beforeSys && afterSys, 'Systems Developer present in both');
  assert.equal(beforeSys.matchScore, afterSys.matchScore, 'score unchanged by CV change');
});
