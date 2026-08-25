const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');

// Stub Cloudinary BEFORE controllers lazily require it.
const cloudinary = require('cloudinary').v2;
let destroyedIds = [];
cloudinary.uploader.destroy = async (publicId) => {
  destroyedIds.push(publicId);
  return { result: 'ok' };
};

const User = require('../models/user');

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

// ── Minimal VALID text-based PDF builder (correct xref offsets) ──────────
function buildPdf(lines) {
  const contentLines = lines
    .map(
      (l, i) =>
        `BT /F1 ${i === 0 ? 14 : 11} Tf 50 ${750 - i * 20} Td (${l.replace(/[()\\]/g, '')}) Tj ET`
    )
    .join('\n');
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] =
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[5] = `<< /Length ${Buffer.byteLength(contentLines)} >>\nstream\n${contentLines}\nendstream`;

  let out = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(out);
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefPos = Buffer.byteLength(out);
  out += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(out, 'binary');
}

const CV_A_LINES = [
  'Curriculum Vitae',
  'Jane Kedir',
  'Frontend Developer with 5 years of experience building web applications.',
  'Technical Skills: JavaScript, TypeScript, React, HTML, CSS',
  'Education: Bachelor of Science in Computer Science - Addis Ababa University',
];

const CV_B_LINES = [
  'Resume',
  'Abebe Bekele',
  'Backend Engineer with 6 years of experience building APIs.',
  'Skills: Python, Django, PostgreSQL, FastAPI',
  'Education: Bachelor of Science in Software Engineering',
];

let mongod;
let server;
let baseUrl;
let serveBytes = null;
let user;

const startFileServer = () =>
  new Promise((resolve) => {
    server = http.createServer((s, res) => {
      // /raw/... mimics Cloudinary raw-resource delivery: no extension,
      // application/octet-stream content type, byte-identical payload.
      if (s.url.endsWith('/raw')) {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        return res.end(serveBytes);
      }
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      res.end(serveBytes);
    });
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}/ethiojob/cvs/cv.pdf`));
  });

// Runs the REAL uploadCV controller against a served PDF.
const uploadCvFile = async (bufferOrName, fileName = 'cvcvcv.pdf', rawDelivery = false) => {
  serveBytes = bufferOrName;
  const storedPath = rawDelivery ? 'ethiojob/cvs/rawasset' : `ethiojob/cvs/${fileName.replace(/\.pdf$/, '')}`;
  const response = await invokeController(require('../controllers/authController').uploadCV, {
    user: { id: user._id.toString() },
    file: {
      path: `${baseUrl}/${rawDelivery ? 'raw' : encodeURIComponent(fileName)}`,
      filename: storedPath,
      originalname: fileName,
      mimetype: 'application/pdf',
      size: serveBytes.length,
    },
    headers: {},
  });
  assert.equal(response.statusCode, 200);
  return response.body;
};

const fetchDashboard = async () => {
  const response = await invokeController(require('../controllers/dashboardController').getDashboard, {
    user: { id: user._id.toString() },
    headers: {},
  });
  assert.equal(response.statusCode, 200);
  return response.body.data;
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  baseUrl = await startFileServer();

  const Skill = require('../models/Skill');
  const Category = require('../models/Category');
  const Company = require('../models/Company');
  const Job = require('../models/job');
  const Resume = require('../models/Resume');

  const names = ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Python', 'Django', 'PostgreSQL', 'FastAPI'];
  const skills = {};
  for (const n of names) skills[n] = await Skill.create({ name: n });

  const employer = await User.create({
    firstName: 'Employer',
    lastName: 'One',
    email: 'parser-employer@demo.com',
    password: 'Password@123',
    role: 'employer',
    isEmailVerified: true,
  });
  const category = await Category.create({ name: 'Information Technology' });
  const company = await Company.create({
    name: 'Emare ICT Hub',
    owner: employer._id,
    email: 'hr@emare.example',
    isApproved: true,
    isActive: true,
  });

  const makeJob = async (title, required) =>
    Job.create({
      title,
      company: company._id,
      postedBy: employer._id,
      category: category._id,
      description: `${title} role`,
      skillsRequired: required.map((n) => skills[n]._id),
      location: { region: 'Addis Ababa' },
      applicationDeadline: new Date(Date.now() + 30 * 864e5),
      status: 'published',
      isApproved: true,
      jobType: 'Full-time',
    });

  await makeJob('Frontend Developer', ['JavaScript', 'React', 'CSS']);
  await makeJob('Backend Developer', ['Python', 'Django', 'PostgreSQL']);

  // Profile noise + Resume Builder doc that must NEVER drive recommendations.
  user = await User.create({
    firstName: 'Solomon',
    lastName: 'Tadesse',
    email: 'parser-pipeline@demo.com',
    password: 'Password@123',
    role: 'jobseeker',
    isEmailVerified: true,
    technicalSkills: ['Rust'],
    softSkills: ['Leadership'],
    experienceYears: 12,
    educationDetails: [{ degree: 'PhD', institution: 'AAU' }],
    bio: 'Rust systems engineer',
  });
  await Resume.create({
    user: user._id,
    title: 'builder cv',
    profile: { title: 'Systems Engineer' },
    skills: [{ name: 'Rust' }],
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (server) server.close();
  if (mongod) await mongod.stop();
});

test('A. readable text PDF → parseStatus ok → recommendationState ready with matching jobs', async () => {
  const pdf = buildPdf(CV_A_LINES);
  const body = await uploadCvFile(pdf, 'cvcvcv.pdf');

  assert.equal(body.parseStatus, 'ok');
  assert.equal(body.data.cvOriginalName, 'cvcvcv.pdf');
  assert.ok(body.data.resumeAnalysis);
  assert.equal(body.data.resumeAnalysis.cvId, body.data.cvPublicId); // tagged to CURRENT file
  assert.deepEqual([...body.data.resumeAnalysis.skillNames].sort(), [
    'CSS',
    'HTML',
    'JavaScript',
    'React',
    'TypeScript',
  ]);

  const data = await fetchDashboard();
  assert.equal(data.recommendationState, 'ready');
  assert.equal(data.canRecommend, true);
  assert.equal(data.resume.hasCV, true);
  assert.ok(data.recommendedJobs.length > 0);

  const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  assert.ok(frontend.matchScore > backend.matchScore); // CV A favours frontend
  assert.ok(!JSON.stringify(frontend.matchedSkills).includes('Rust')); // no profile leak
});

test('B. unreadable/image-only PDF → parse fails, recommendation still uses profile', async () => {
  const garbage = Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 31 + 7) % 256));
  const body = await uploadCvFile(garbage, 'scanned.pdf');

  assert.notEqual(body.parseStatus, 'ok'); // insufficient_content or failed

  const data = await fetchDashboard();
  assert.equal(data.recommendationSource, 'profile');
  assert.equal(data.canRecommend, true);
  assert.ok(data.recommendedJobs.length > 0);
});

test('B2. raw-delivered PDF (no extension, octet-stream) still parses via magic bytes', async () => {
  const body = await uploadCvFile(buildPdf(CV_A_LINES), 'cvcvcv.pdf', true);
  assert.equal(body.parseStatus, 'ok');
  assert.ok(body.data.resumeAnalysis);
  assert.equal(body.data.resumeAnalysis.cvId, body.data.cvPublicId);
  assert.ok(body.data.resumeAnalysis.skillNames.length > 0);

  const data = await fetchDashboard();
  assert.equal(data.recommendationState, 'ready');
  assert.ok(data.recommendedJobs.length > 0);
});

test('D. replace A with B → B analysis replaces A, recommendations invert to B', async () => {
  const bodyB = await uploadCvFile(buildPdf(CV_B_LINES), 'cv-b.pdf');
  assert.equal(bodyB.parseStatus, 'ok');
  assert.deepEqual(
    [...bodyB.data.resumeAnalysis.skillNames].sort(),
    ['Django', 'FastAPI', 'PostgreSQL', 'Python'].sort()
  );

  const data = await fetchDashboard();
  assert.equal(data.recommendationState, 'ready');
  const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(backend.matchScore > frontend.matchScore); // inverted vs CV A run
  assert.ok(backend.matchScore >= 40);
});

test('E/F. remove B → profile still provides; re-upload A → identical deterministic scores', async () => {
  const removeRes = await invokeController(require('../controllers/authController').deleteCV, {
    user: { id: user._id.toString() },
  });
  assert.equal(removeRes.statusCode, 200);
  const emptyData = await fetchDashboard();
  assert.equal(emptyData.recommendationSource, 'profile');
  assert.ok(emptyData.recommendedJobs.length > 0, 'profile still provides recommendations');

  const againBody = await uploadCvFile(buildPdf(CV_A_LINES), 'cvcvcv.pdf');
  assert.equal(againBody.parseStatus, 'ok');

  const firstRun = await fetchDashboard();
  assert.equal(firstRun.recommendationState, 'ready');
  const frontendFirst = firstRun.recommendedJobs.find((j) => j.title === 'Frontend Developer');

  const secondRun = await fetchDashboard();
  const frontendSecond = secondRun.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.equal(frontendFirst.matchScore, frontendSecond.matchScore); // deterministic
  assert.ok(frontendFirst.matchScore > 0);
});

test('G/H. profile noise and builder doc survived everything but never affected results', async () => {
  const doc = await User.findById(user._id).lean();
  assert.deepEqual(doc.technicalSkills, ['Rust']);
  assert.deepEqual(doc.softSkills, ['Leadership']);
  const Resume = require('../models/Resume');
  // Original builder cv + CV-upload-derived resumes (each upload creates a Resume Builder doc).
  const resumeCount = await Resume.countDocuments({ user: user._id });
  assert.ok(resumeCount >= 1, `at least one Resume exists (found ${resumeCount})`);

  // Stale identity rule (I): analysis from another file must NOT unlock.
  const { hasCurrentCvAnalysis } = require('../utils/dashboardHelpers');
  const staleUser = doc;
  staleUser.cvPublicId = 'ethiojob/cvs/DIFFERENT-file';
  assert.equal(hasCurrentCvAnalysis(staleUser), false);
});
