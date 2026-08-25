const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const cloudinary = require('cloudinary').v2;
cloudinary.uploader.destroy = async () => ({ result: 'ok' });

const User = require('../models/user');
const Skill = require('../models/Skill');
const Company = require('../models/Company');
const Job = require('../models/job');
const Resume = require('../models/Resume');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const jobController = require('../controllers/jobController');

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
let frontendJob;
let backendJob;
let systemsJob;

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

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const names = ['HTML', 'CSS', 'React', 'JavaScript', 'Python', 'Django', 'PostgreSQL', 'FastAPI', 'Rust', 'C++', 'C#'];
  const skills = {};
  for (const name of names) skills[name] = await Skill.create({ name });

  const Category = require('../models/Category');
  const category = await Category.create({ name: 'Information Technology' });
  const employer = await User.create({
    firstName: 'Employer', lastName: 'One', email: 'readiness-employer@demo.com',
    password: 'Password@123', role: 'employer', isEmailVerified: true,
  });
  const company = await Company.create({
    name: 'Emare ICT Hub', owner: employer._id, email: 'hr@readiness.example',
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
    firstName: 'Solomon', lastName: 'Tadesse', email: 'readiness@demo.com',
    password: 'Password@123', role: 'jobseeker', isEmailVerified: true,
    technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
    experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }],
    bio: 'Rust systems engineer',
  });
  await Resume.create({ user: user._id, title: 'resume builder cv', profile: { title: 'Systems Engineer' }, skills: [{ name: 'Rust' }] });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('BASIC: profile with Rust + Resume Builder → ready, recommendations produced', async () => {
  const data = await fetchDashboard();
  assert.equal(data.recommendationState, 'ready');
  assert.equal(data.recommendationSource, 'profile');
  assert.equal(data.canRecommend, true);
  assert.ok(data.recommendedJobs.length > 0, 'recommendations produced');
});

let profileRustScore;

test('DETERMINISTIC: profile changes change recommendations', async () => {
  const data = await fetchDashboard();
  const fe = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  const sys = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok(fe, 'Frontend Developer recommended');
  assert.ok(sys, 'Systems Developer recommended');
  assert.ok(sys.matchScore > fe.matchScore, 'Systems Dev scores higher for Rust user');
  profileRustScore = sys.matchScore;

  // Change profile to Python → Backend Developer should now score higher.
  await User.updateOne({ _id: user._id }, { $set: { technicalSkills: ['Python'], skillNames: ['Python'] } });
  await Resume.updateOne({ user: user._id }, { $set: { skills: [{ name: 'Python' }] } });

  const dataPy = await fetchDashboard();
  assert.equal(dataPy.recommendationSource, 'profile');
  const bePy = dataPy.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok((bePy.matchedSkills || []).includes('Python'), 'Python matches Backend Developer');

  // Restore.
  await User.updateOne({ _id: user._id }, { $set: { technicalSkills: ['Rust'], skillNames: [] } });
  await Resume.updateOne({ user: user._id }, { $set: { skills: [{ name: 'Rust' }] } });
});

test('RESUME BUILDER only: profile empty, Resume Builder has React → recommendations from Resume Builder', async () => {
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [] },
  });
  await Resume.updateOne({ user: user._id, title: 'resume builder cv' }, { $set: { skills: [{ name: 'React' }] } });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  const fe = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(fe, 'Frontend Developer recommended');
  assert.ok((fe.matchedSkills || []).includes('React'),
    'Resume Builder React matches Frontend Developer');

  // Restore.
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
      experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
      educationDetails: [{ degree: 'PhD', institution: 'AAU' }] },
  });
  await Resume.updateOne({ user: user._id, title: 'resume builder cv' }, { $set: { skills: [{ name: 'Rust' }] } });
});

test('COMBINED: Resume Builder + Profile skills are merged for matching', async () => {
  // Profile has Python, Resume Builder has Django.
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: ['Python'], skillNames: ['Python'] },
  });
  await Resume.updateOne({ user: user._id, title: 'resume builder cv' }, {
    $set: { skills: [{ name: 'Django' }] },
  });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  const be = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok(be, 'Backend Developer recommended');
  // Both Python and Django should match.
  assert.ok((be.matchedSkills || []).includes('Python'), 'Python from profile matches');
  assert.ok((be.matchedSkills || []).includes('Django'), 'Django from Resume Builder matches');

  // Restore.
  await User.updateOne({ _id: user._id }, { $set: { technicalSkills: ['Rust'], skillNames: [] } });
  await Resume.updateOne({ user: user._id, title: 'resume builder cv' }, { $set: { skills: [{ name: 'Rust' }] } });
});

test('CV UPLOAD does NOT affect recommendations — CV data is ignored', async () => {
  // Upload a CV with HTML/CSS/React/JS skills.
  const person = await User.findById(user._id);
  person.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/cv-upload.pdf';
  person.cvPublicId = 'ethiojob/cvs/cv-upload';
  person.cvOriginalName = 'cv-upload.pdf';
  person.resumeAnalysis = {
    cvId: 'ethiojob/cvs/cv-upload',
    skillNames: ['HTML', 'CSS', 'React', 'JavaScript'],
    skills: [],
    professionalTitle: 'Frontend Developer',
    experienceYears: 3,
    education: ['BSc Computer Science'],
  };
  await person.save({ validateBeforeSave: false });

  const data = await fetchDashboard();
  // Source is still profile (Rust from Resume Builder), not CV.
  assert.equal(data.recommendationSource, 'profile');
  // CV skills must NOT appear in matchedSkills.
  const fe = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  if (fe) {
    for (const skill of (fe.matchedSkills || [])) {
      assert.ok(!['HTML', 'CSS', 'React', 'JavaScript'].includes(skill),
        `CV skill "${skill}" must not appear when CV is ignored`);
    }
  }

  // Restore.
  await User.updateOne({ _id: user._id }, {
    $set: { cv: null, cvPublicId: null, cvOriginalName: null, resumeAnalysis: null },
  });
});

test('CV DELETION does NOT affect recommendations — profile source persists', async () => {
  // Apply CV.
  const person = await User.findById(user._id);
  person.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/temp.pdf';
  person.cvPublicId = 'ethiojob/cvs/temp';
  person.cvOriginalName = 'temp.pdf';
  person.resumeAnalysis = { skillNames: ['Python'], skills: [], professionalTitle: 'Backend Dev' };
  await person.save({ validateBeforeSave: false });

  const before = await fetchDashboard();
  assert.equal(before.recommendationSource, 'profile');

  // Delete CV.
  await invokeController(authController.deleteCV, { user: { id: user._id.toString() } });

  // Recommendations unchanged — still profile-based.
  const after = await fetchDashboard();
  assert.equal(after.recommendationSource, 'profile');
  assert.ok(after.recommendedJobs.length > 0, 'recommendations still produced after CV deletion');
});

test('RESUME BUILDER CHANGES deterministically change recommendations', async () => {
  // Clear profile so Resume Builder is the sole source.
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [] },
  });

  // Resume Builder has React → should match Frontend Developer.
  await Resume.findOneAndUpdate({ user: user._id }, { $set: { skills: [{ name: 'React' }] } });
  const dataReact = await fetchDashboard();
  const feReact = dataReact.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(feReact, 'Frontend Developer in results');
  assert.ok((feReact.matchedSkills || []).includes('React'), 'React from Resume Builder matches Frontend Developer');

  // Change Resume Builder to Python → should match Backend Developer.
  await Resume.findOneAndUpdate({ user: user._id }, { $set: { skills: [{ name: 'Python' }] } });
  const dataPy = await fetchDashboard();
  const bePy = dataPy.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok(bePy, 'Backend Developer in results');
  assert.ok((bePy.matchedSkills || []).includes('Python'), 'Python from Resume Builder matches Backend Developer');
  assert.notEqual(feReact.matchScore, dataPy.recommendedJobs.find((j) => j.title === 'Frontend Developer').matchScore,
    'different Resume Builder skills → different scores');

  // Restore.
  await Resume.findOneAndUpdate({ user: user._id }, { $set: { skills: [{ name: 'Rust' }] } });
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
      experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
      educationDetails: [{ degree: 'PhD', institution: 'AAU' }] },
  });
});

test('PROFILE CHANGES deterministically change recommendations', async () => {
  await User.updateOne({ _id: user._id }, { $set: { technicalSkills: ['Python'], skillNames: ['Python'] } });
  const dataPy = await fetchDashboard();
  const bePy = dataPy.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok((bePy.matchedSkills || []).includes('Python'));

  await User.updateOne({ _id: user._id }, { $set: { technicalSkills: ['C++'], skillNames: ['C++'] } });
  const dataCpp = await fetchDashboard();
  const sysCpp = dataCpp.recommendedJobs.find((j) => j.title === 'Systems Developer');
  assert.ok((sysCpp.matchedSkills || []).includes('C++'));
  assert.notEqual(bePy.matchScore, dataCpp.recommendedJobs.find((j) => j.title === 'Backend Developer').matchScore,
    'different profile skills → different scores');

  // Restore.
  await User.updateOne({ _id: user._id }, { $set: { technicalSkills: ['Rust'], skillNames: [] } });
});

test('EMPTY profile + no Resume Builder → no recommendations', async () => {
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [], headline: '' },
  });
  await Resume.deleteMany({ user: user._id });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'none');
  assert.equal(data.recommendationState, 'no_cv');
  assert.equal(data.canRecommend, false);

  const recs = await fetchRecommendations();
  assert.equal(recs.recommendationSource, 'none');
  assert.equal(recs.recommendations.length, 0);

  // Restore.
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
      experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
      educationDetails: [{ degree: 'PhD', institution: 'AAU' }] },
  });
  await Resume.create({ user: user._id, title: 'resume builder cv', profile: { title: 'Systems Engineer' }, skills: [{ name: 'Rust' }] });
});

test('ENDPOINT PARITY: recommendationSource matches between dashboard and /api/jobs/recommendations', async () => {
  const dash = await fetchDashboard();
  const recs = await fetchRecommendations();
  assert.equal(dash.recommendationSource, recs.recommendationSource);

  for (const rec of recs.recommendations) {
    const dashJob = dash.recommendedJobs.find((j) => j.jobId === rec.jobId || j._id === rec.jobId);
    assert.ok(dashJob, `${rec.title} present on dashboard`);
    assert.equal(rec.matchScore, dashJob.matchScore);
    assert.deepEqual([...(rec.matchedSkills || [])].sort(), [...(dashJob.matchedSkills || [])].sort());
  }
});

test('NO resumeAnalysis leakage: CV analysis skills never appear in matchedSkills', async () => {
  // Upload CV with Python/Django.
  const person = await User.findById(user._id);
  person.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/leak.pdf';
  person.cvPublicId = 'ethiojob/cvs/leak';
  person.resumeAnalysis = {
    cvId: 'ethiojob/cvs/leak',
    skillNames: ['Python', 'Django', 'PostgreSQL', 'FastAPI'],
    skills: [],
    professionalTitle: 'Backend Developer',
    experienceYears: 5,
    education: ['BSc'],
  };
  await person.save({ validateBeforeSave: false });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['Python', 'Django', 'PostgreSQL', 'FastAPI'].includes(skill),
        `CV analysis skill "${skill}" must not leak into recommendations`);
    }
  }

  // Cleanup.
  await User.updateOne({ _id: user._id }, {
    $set: { cv: null, cvPublicId: null, cvOriginalName: null, resumeAnalysis: null },
  });
});

test('STALE CV IDENTITY cannot affect recommendations', async () => {
  const person = await User.findById(user._id);
  person.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/new.pdf';
  person.cvPublicId = 'ethiojob/cvs/new';
  person.resumeAnalysis = {
    cvId: 'ethiojob/cvs/old-file',
    skillNames: ['Python', 'Django'],
    skills: [],
    professionalTitle: 'Backend Developer',
  };
  await person.save({ validateBeforeSave: false });

  const data = await fetchDashboard();
  // CV data is ignored entirely — source is profile.
  assert.equal(data.recommendationSource, 'profile');
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['Python', 'Django'].includes(skill),
        `stale CV skill "${skill}" must not leak`);
    }
  }

  // Cleanup.
  await User.updateOne({ _id: user._id }, {
    $set: { cv: null, cvPublicId: null, cvOriginalName: null, resumeAnalysis: null },
  });
});

test('Multiple Resume Builder docs: only the latest is used', async () => {
  // Clear profile so Resume Builder is the sole source.
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: [], skillNames: [], softSkills: [], experienceYears: null, experienceDetails: [], educationDetails: [] },
  });

  // Set the main resume to React (matches Frontend Developer).
  await Resume.findOneAndUpdate({ user: user._id, title: 'resume builder cv' }, { $set: { skills: [{ name: 'React' }] } });
  // Create an older Resume Builder doc with Python.
  await Resume.create({ user: user._id, title: 'old resume', skills: [{ name: 'Python' }] });
  // Ensure the main resume is the most recent.
  await Resume.findOneAndUpdate({ user: user._id, title: 'resume builder cv' }, { $set: { updatedAt: new Date() } });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  const fe = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(fe, 'Frontend Developer recommended');
  assert.ok((fe.matchedSkills || []).includes('React'), 'latest Resume Builder React matches Frontend Developer');
  // Old resume Python must NOT appear.
  const be = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  if (be) {
    assert.ok(!(be.matchedSkills || []).includes('Python'), 'old resume Python must not leak');
  }

  // Cleanup old resume and restore profile.
  await Resume.deleteMany({ user: user._id, title: 'old resume' });
  await User.updateOne({ _id: user._id }, {
    $set: { technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
      experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
      educationDetails: [{ degree: 'PhD', institution: 'AAU' }] },
  });
});
