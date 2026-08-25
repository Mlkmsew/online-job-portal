const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const cloudinary = require('cloudinary').v2;
let destroyedIds = [];
cloudinary.uploader.destroy = async (publicId) => {
  destroyedIds.push(publicId);
  return { result: 'ok' };
};

const User = require('../models/user');
const Skill = require('../models/Skill');
const Company = require('../models/Company');
const Job = require('../models/job');
const Resume = require('../models/Resume');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');

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

const applyCv = async (userId, { fileName, skillNames, title }) => {
  const person = await User.findById(userId);
  const skills = await Skill.find({ name: { $in: skillNames } });
  person.cv = `https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/${fileName}`;
  person.cvPublicId = `ethiojob/cvs/${fileName.replace(/\.pdf$/, '')}`;
  person.cvOriginalName = fileName;
  person.cvDetachedAt = null;
  person.cvVersion = (person.cvVersion || 0) + 1;
  person.resumeAnalysis = {
    cvId: person.cvPublicId,
    skillNames,
    skills: skills.map((s) => s._id),
    professionalTitle: title,
    experienceYears: 3,
    education: ['BSc Computer Science'],
  };
  await person.save({ validateBeforeSave: false });
};

const fetchDashboard = async () => {
  const response = await invokeController(dashboardController.getDashboard, {
    user: { id: user._id.toString() },
    headers: {},
  });
  assert.equal(response.statusCode, 200);
  return response.body.data;
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const skillNames = ['HTML', 'CSS', 'React', 'JavaScript', 'Python', 'Django', 'PostgreSQL', 'FastAPI', 'Rust'];
  const skills = {};
  for (const name of skillNames) skills[name] = await Skill.create({ name });

  const Category = require('../models/Category');
  const category = await Category.create({ name: 'Information Technology' });
  const employer = await User.create({
    firstName: 'Employer', lastName: 'One', email: 'employer-lifecycle@demo.com',
    password: 'Password@123', role: 'employer', isEmailVerified: true,
  });
  const company = await Company.create({
    name: 'Emare ICT Hub', owner: employer._id, email: 'hr@emare.example',
    isApproved: true, isActive: true,
  });
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const makeJob = async (title, required) =>
    Job.create({
      title, company: company._id, postedBy: employer._id, category: category._id,
      description: `${title} role`, skillsRequired: required.map((n) => skills[n]._id),
      location: { region: 'Addis Ababa' }, applicationDeadline: deadline,
      status: 'published', isApproved: true, jobType: 'Full-time',
    });

  frontendJob = await makeJob('Frontend Developer', ['HTML', 'CSS', 'React']);
  backendJob = await makeJob('Backend Developer', ['Python', 'Django', 'PostgreSQL']);

  user = await User.create({
    firstName: 'Solomon', lastName: 'Tadesse', email: 'lifecycle@demo.com',
    password: 'Password@123', role: 'jobseeker', isEmailVerified: true,
    technicalSkills: ['Rust'], softSkills: ['Leadership'], experienceYears: 9,
    experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }],
    bio: 'Rust and Go systems engineer',
  });
  await Resume.create({
    user: user._id, title: 'resume builder cv',
    profile: { title: 'Systems Engineer' }, skills: [{ name: 'Rust' }],
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('CASE 1: profile + Resume Builder produce recommendations regardless of CV', async () => {
  const data = await fetchDashboard();
  assert.ok(data.recommendedJobs.length > 0);
  assert.equal(data.recommendationState, 'ready');
  assert.equal(data.recommendationSource, 'profile');
  assert.equal(data.canRecommend, true);
});

test('CASE 2: CV removal does NOT remove recommendations — profile source persists', async () => {
  // Upload a CV first.
  await applyCv(user, { fileName: 'cv-a.pdf', skillNames: ['HTML', 'CSS', 'React', 'JavaScript'], title: 'Frontend Developer' });
  const before = await fetchDashboard();
  assert.equal(before.recommendationSource, 'profile');

  // Remove CV.
  const response = await invokeController(authController.deleteCV, { user: { id: user._id.toString() } });
  assert.equal(response.statusCode, 200);

  const after = await fetchDashboard();
  assert.equal(after.recommendationSource, 'profile');
  assert.ok(after.recommendedJobs.length > 0, 'recommendations persist after CV removal');
});

test('CASE B: unreadable CV → recommendation still uses profile', async () => {
  const person = await User.findById(user._id);
  person.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/cvcvcv.pdf';
  person.cvPublicId = 'ethiojob/cvs/cvcvcv';
  person.cvOriginalName = 'cvcvcv.pdf';
  person.cvDetachedAt = null;
  person.cvVersion = (person.cvVersion || 0) + 1;
  person.resumeAnalysis = { cvId: 'ethiojob/cvs/cvcvcv' };
  await person.save({ validateBeforeSave: false });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  assert.equal(data.canRecommend, true);
  assert.ok(data.recommendedJobs.length > 0);
});

test('CASE 3: uploading CV B does not change recommendations — profile drives', async () => {
  await applyCv(user, {
    fileName: 'cv-b.pdf',
    skillNames: ['Python', 'Django', 'PostgreSQL', 'FastAPI'],
    title: 'Backend Developer',
  });

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  // CV B skills must not appear in matchedSkills — profile (Rust) drives.
  for (const job of data.recommendedJobs) {
    for (const skill of (job.matchedSkills || [])) {
      assert.ok(!['Python', 'Django', 'PostgreSQL', 'FastAPI'].includes(skill),
        `CV B skill "${skill}" must not leak`);
    }
  }
});

test('CASE 4/5: CV removal + re-upload → recommendations always profile-based', async () => {
  const removeRes = await invokeController(authController.deleteCV, { user: { id: user._id.toString() } });
  assert.equal(removeRes.statusCode, 200);
  const emptyData = await fetchDashboard();
  assert.equal(emptyData.recommendationSource, 'profile');
  assert.ok(emptyData.recommendedJobs.length > 0);

  await applyCv(user, {
    fileName: 'cv-a-again.pdf',
    skillNames: ['HTML', 'CSS', 'React', 'JavaScript'],
    title: 'Frontend Developer',
  });
  const again = await fetchDashboard();
  assert.equal(again.recommendationSource, 'profile');
  assert.ok(again.recommendedJobs.length > 0);
});

test('protected profile & Resume Builder data survived every operation', async () => {
  const doc = await User.findById(user._id).lean();
  assert.deepEqual(doc.technicalSkills, ['Rust']);
  assert.deepEqual(doc.softSkills, ['Leadership']);
  assert.equal(doc.experienceYears, 9);
  assert.equal(doc.educationDetails[0].degree, 'PhD');
  const resumes = await Resume.countDocuments({ user: user._id });
  assert.equal(resumes, 1);
});
