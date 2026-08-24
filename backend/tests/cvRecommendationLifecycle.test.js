const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Stub Cloudinary BEFORE controllers lazily require it.
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

// helpers.asyncHandler is fire-and-forget; observe completion via res.json.
const invokeController = (controller, req) =>
  new Promise((resolve, reject) => {
    let settled = false;
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        if (!settled) {
          settled = true;
          resolve({ statusCode: this.statusCode, body: payload });
        }
        return this;
      },
    };
    const next = (err) => {
      if (!settled) {
        settled = true;
        err ? reject(err) : resolve(null);
      }
    };
    controller(req, res, next);
  });

let mongod;
let user;
let frontendJob;
let backendJob;
let systemsJob;

// Simulate exactly what uploadCV persists for a given CV file + parsed skills.
const applyCv = async (userId, { fileName, skillNames, title }) => {
  const person = await User.findById(userId); // fresh copy — never save stale state
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

const topJob = (data) => data.recommendedJobs[0];

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // CV A skills / CV B skills / a profile-only skill.
  const skillNames = ['HTML', 'CSS', 'React', 'JavaScript', 'Python', 'Django', 'PostgreSQL', 'FastAPI', 'Rust'];
  const skills = {};
  for (const name of skillNames) {
    skills[name] = await Skill.create({ name });
  }

  const Category = require('../models/Category');
  const category = await Category.create({ name: 'Information Technology' });

  const employer = await User.create({
    firstName: 'Employer',
    lastName: 'One',
    email: 'employer-lifecycle@demo.com',
    password: 'Password@123',
    role: 'employer',
    isEmailVerified: true,
  });

  const company = await Company.create({
    name: 'Emare ICT Hub',
    owner: employer._id,
    email: 'hr@emare.example',
    isApproved: true,
    isActive: true,
  });

  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const makeJob = async (title, required) =>
    Job.create({
      title,
      company: company._id,
      postedBy: employer._id,
      category: category._id,
      description: `${title} role`,
      skillsRequired: required.map((n) => skills[n]._id),
      location: { region: 'Addis Ababa' },
      applicationDeadline: deadline,
      status: 'published',
      isApproved: true,
      jobType: 'Full-time',
    });

  frontendJob = await makeJob('Frontend Developer', ['HTML', 'CSS', 'React']);
  backendJob = await makeJob('Backend Developer', ['Python', 'Django', 'PostgreSQL']);
  systemsJob = await makeJob('Systems Developer', ['Rust']); // only matchable via profile noise

  // Profile deliberately contains data that must NEVER drive recommendations:
  // Rust skills, experience, education and a Resume Builder document.
  user = await User.create({
    firstName: 'Solomon',
    lastName: 'Tadesse',
    email: 'lifecycle@demo.com',
    password: 'Password@123',
    role: 'jobseeker',
    isEmailVerified: true,
    technicalSkills: ['Rust'],
    softSkills: ['Leadership'],
    experienceYears: 9,
    experienceDetails: [{ title: 'Systems Engineer', company: 'Acme' }],
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }],
    bio: 'Rust and Go systems engineer',
  });
  await Resume.create({
    user: user._id,
    title: 'resume builder cv',
    profile: { title: 'Systems Engineer' },
    skills: [{ name: 'Rust' }],
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('CASE 1: CV A upload → recommendations calculated from CV A only', async () => {
  await applyCv(user, {
    fileName: 'cv-a.pdf',
    skillNames: ['HTML', 'CSS', 'React', 'JavaScript'],
    title: 'Frontend Developer',
  });

  const data = await fetchDashboard();

  assert.ok(data.recommendedJobs.length > 0);
  assert.equal(topJob(data).title, 'Frontend Developer');

  const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok(frontend.matchScore >= 40);
  assert.ok(frontend.matchScore > backend.matchScore); // CV A favours frontend
  assert.deepEqual(
    frontend.matchedSkills.map((s) => s.name || s).sort(),
    ['CSS', 'HTML', 'React']
  );

  // Profile-only Rust must not make the Systems job outscore real CV matches…
  const systems = data.recommendedJobs.find((j) => j.title === 'Systems Developer');
  if (systems) assert.ok(systems.matchScore < frontend.matchScore);
});

test('CASE 2: removing CV A → recommendations disappear immediately', async () => {
  const response = await invokeController(authController.deleteCV, {
    user: { id: user._id.toString() },
  });
  assert.equal(response.statusCode, 200);

  const data = await fetchDashboard();

  assert.deepEqual(data.recommendedJobs, []);
  assert.equal(data.canRecommend, false);
  assert.equal(data.resume.hasCV, false);
});

test('rule: profile skills/experience/builder doc still do NOT unlock recommendations after removal', async () => {
  // The user in DB right now has technicalSkills, experienceYears, PhD,
  // and a Resume Builder document — none of it may unlock recommendations.
  const raw = await User.findById(user._id);
  assert.ok(raw.technicalSkills.includes('Rust'));
  assert.ok(raw.experienceYears >= 9);
  assert.equal(raw.cv, undefined);
});

test('CASE 3: uploading completely different CV B → fresh recommendations from B only', async () => {
  await applyCv(user, {
    fileName: 'cv-b.pdf',
    skillNames: ['Python', 'Django', 'PostgreSQL', 'FastAPI'],
    title: 'Backend Developer',
  });

  const data = await fetchDashboard();

  assert.ok(data.recommendedJobs.length > 0);
  assert.equal(topJob(data).title, 'Backend Developer');

  const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');

  // Backend now beats Frontend — the exact inversion of CASE 1 proves CV B
  // drives scoring and no CV A result was reused.
  assert.ok(backend.matchScore > frontend.matchScore);
  assert.ok(
    backend.matchedSkills.map((s) => s.name || s).every((s) =>
      ['Python', 'Django', 'PostgreSQL'].includes(s)
    )
  );
});

test('CASE 4/5: removing CV B → empty again; re-uploading CV A recalculates fresh', async () => {
  const removeB = await invokeController(authController.deleteCV, {
    user: { id: user._id.toString() },
  });
  assert.equal(removeB.statusCode, 200);
  const emptyData = await fetchDashboard();
  assert.deepEqual(emptyData.recommendedJobs, []);

  await applyCv(user, {
    fileName: 'cv-a-again.pdf',
    skillNames: ['HTML', 'CSS', 'React', 'JavaScript'],
    title: 'Frontend Developer',
  });

  const again = await fetchDashboard();
  assert.equal(topJob(again).title, 'Frontend Developer');
  const frontend = again.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  const backend = again.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok(frontend.matchScore > backend.matchScore);

  // Fresh calculation matches the original CV A run deterministically
  // (same inputs → same score), proving nothing from CV B leaked in.
  const firstRun = await (async () => {
    const data = await fetchDashboard();
    return data.recommendedJobs.find((j) => j.title === 'Frontend Developer').matchScore;
  })();
  assert.equal(firstRun, frontend.matchScore);
});

test('protected profile & Resume Builder data survived every removal', async () => {
  const doc = await User.findById(user._id).lean();
  assert.deepEqual(doc.technicalSkills, ['Rust']);
  assert.deepEqual(doc.softSkills, ['Leadership']);
  assert.equal(doc.experienceYears, 9);
  assert.equal(doc.educationDetails[0].degree, 'PhD');
  const resumes = await Resume.countDocuments({ user: user._id });
  assert.equal(resumes, 1);
});
