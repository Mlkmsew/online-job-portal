// REGRESSION TEST — CV download authentication (the "download_http_error
// {"status":401}" / "Unable to download resume file: Unauthorized" bug).
//
// Simulates a Cloudinary account whose security settings block unsigned PDF
// delivery: fetching the stored delivery URL returns 401, while the SAME
// secret-signed Admin-API download request used by production (employer resume
// streaming) must yield the actual PDF bytes.
//
// Proves end-to-end through the REAL controllers:
//   upload → Cloudinary storage refs → 401 on public URL → authenticated
//   server-side download (signature verified exactly like Cloudinary does) →
//   real PDF bytes reach the parser → structured resumeAnalysis →
//   resumeAnalysis.cvId === current cvPublicId → recommendationState 'ready'.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Cloudinary credentials MUST be set before any backend module is required
// (config/cloudinary.js snapshots them at load time). Never real secrets.
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

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

// Realistic production shape of a stored raw-resource CV delivery URL
// (folder + version segment + .pdf extension).
const STORED_CV_URL =
  'https://res.cloudinary.com/test-cloud/raw/upload/v1756000000/ethiojob/cvs/cvcvcv.pdf';
const STORED_PUBLIC_ID = 'ethiojob/cvs/cvcvcv.pdf';

// ── fetch simulation: restricted-account Cloudinary ──────────────────────
// Every public delivery request → 401 (exactly the reported production log).
// Every signed api.cloudinary.com /download request → the REAL PDF bytes,
// but ONLY after the signature verifies (same sha1 recipe Cloudinary uses).
let pdfBytes = null;
const requests = [];

const verifySignedDownloadRequest = (urlString) => {
  const parsed = new URL(urlString);
  assert.match(parsed.pathname, /^\/v1_1\/test-cloud\/raw\/download$/);

  const params = {};
  for (const [key, value] of parsed.searchParams) {
    if (key !== 'signature' && key !== 'api_key') params[key] = value;
  }
  assert.equal(params.public_id, STORED_PUBLIC_ID, 'signed request must address THIS uploaded asset');
  assert.equal(params.type, 'upload');
  assert.match(params.timestamp, /^\d+$/);

  // Signature check identical to cloudinary.utils.api_sign_request:
  // sorted "key=value" pairs joined by '&' + api_secret, hashed with sha1.
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const expected = crypto.createHash('sha1').update(toSign + process.env.CLOUDINARY_API_SECRET).digest('hex');
  assert.equal(parsed.searchParams.get('signature'), expected, 'request must carry a VALID API-secret signature');
  assert.equal(parsed.searchParams.get('api_key'), process.env.CLOUDINARY_API_KEY);
};

global.fetch = async (url) => {
  requests.push(String(url));
  if (!String(url).includes('/download?')) {
    return {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'text/html' },
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  }
  verifySignedDownloadRequest(String(url));
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/octet-stream' },
    arrayBuffer: async () =>
      pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
  };
};

let mongod;
let user;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const Skill = require('../models/Skill');
  const Category = require('../models/Category');
  const Company = require('../models/Company');
  const Job = require('../models/job');

  const names = ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Python', 'Django'];
  const skills = {};
  for (const n of names) skills[n] = await Skill.create({ name: n });

  const employer = await User.create({
    firstName: 'Employer',
    lastName: 'One',
    email: 'dl-employer@demo.com',
    password: 'Password@123',
    role: 'employer',
    isEmailVerified: true,
  });
  const category = await Category.create({ name: 'Information Technology' });
  const company = await Company.create({
    name: 'Emare ICT Hub',
    owner: employer._id,
    email: 'hr-dl@emare.example',
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
  await makeJob('Backend Developer', ['Python', 'Django']); // intentionally unmatchable by CV A

  // Profile noise that must NEVER drive recommendations.
  user = await User.create({
    firstName: 'Solomon',
    lastName: 'Tadesse',
    email: 'dl-pipeline@demo.com',
    password: 'Password@123',
    role: 'jobseeker',
    isEmailVerified: true,
    technicalSkills: ['Rust'],
    experienceYears: 12,
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const uploadStoredPdf = async () => {
  const response = await invokeController(require('../controllers/authController').uploadCV, {
    user: { id: user._id.toString() },
    file: {
      path: STORED_CV_URL,
      filename: STORED_PUBLIC_ID,
      originalname: 'cvcvcv.pdf',
      mimetype: 'application/pdf',
      size: pdfBytes.length,
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

test('REGRESSION: public URL 401 → authenticated signed download → real PDF bytes → analysis → recommendations', { timeout: 120000 }, async () => {
  pdfBytes = buildPdf(CV_A_LINES);
  requests.length = 0;

  const body = await uploadStoredPdf();

  // Download layer: exactly one failed public attempt, then ONE validly-signed
  // authenticated download that returned the ACTUAL PDF bytes.
  assert.equal(requests[0], STORED_CV_URL, 'first attempt must be the stored delivery URL');
  assert.equal(requests.length, 2, 'must fall back to exactly one signed download request');
  assert.match(requests[1], /api\.cloudinary\.com\/v1_1\/test-cloud\/raw\/download\?/);
  assert.match(requests[1], /signature=[0-9a-f]{40}/);
  assert.doesNotMatch(requests[1], /api_secret/, 'API secret must never appear in any URL');

  // Parser actually received non-empty, correct bytes (embedded text present).
  assert.equal(body.parseStatus, 'ok');
  assert.ok(body.data.resumeAnalysis, 'analysis must be created despite the 401');
  assert.ok(body.data.resumeAnalysis.rawText.length >= 100, 'parser must receive the real PDF text');

  // Identity binding: analysis belongs to THIS upload only.
  assert.equal(body.data.cvPublicId, STORED_PUBLIC_ID);
  assert.equal(body.data.resumeAnalysis.cvId, body.data.cvPublicId, 'cvId must match current cvPublicId');
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
  assert.ok(data.recommendedJobs.length > 0, 'Recommended Jobs must be populated');

  const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(frontend);
  assert.ok(frontend.matchScore > 0);
  assert.ok(!JSON.stringify(frontend.matchedSkills).includes('Rust'), 'profile noise must not leak');
});

test('unit: fetchStoredFileBuffer retries 401 via signed download and preserves extension info', { timeout: 30000 }, async () => {
  const { fetchStoredFileBuffer } = require('../utils/cloudinaryFile');
  pdfBytes = Buffer.from('fake-pdf-content');

  const result = await fetchStoredFileBuffer(STORED_CV_URL, { cvPublicId: STORED_PUBLIC_ID });
  assert.equal(result.method, 'signed_download');
  assert.equal(result.ext, '.pdf');
  assert.deepEqual([...result.buffer], [...pdfBytes]);
});

test('unit: non-Cloudinary http URL that fails stays a clean error without signed retries', { timeout: 30000 }, async () => {
  const { fetchStoredFileBuffer } = require('../utils/cloudinaryFile');
  requests.length = 0;
  await assert.rejects(
    fetchStoredFileBuffer('https://evil.example.com/resume.pdf'),
    /Unable to download resume file/
  );
  assert.equal(requests.length, 1, 'no Cloudinary signed retry for foreign hosts');
});
