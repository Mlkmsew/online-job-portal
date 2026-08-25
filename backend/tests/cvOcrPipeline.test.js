const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const zlib = require('zlib');

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

// ── Scanned-PDF fixture: a real PDF whose only content is a raster image ──
// The text is rendered onto a bitmap (no text layer at all), exactly like a
// scanned or image-exported CV. Embedded-text extraction MUST find ~0 chars.
async function renderLinesToRgb(lines, { noise = false } = {}) {
  const { createCanvas } = await import('@napi-rs/canvas');
  const W = 1240;
  const H = 1754; // A4-ish @150dpi
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (!noise) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 46px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, 90, 160 + i * 78));
  } else {
    // Deterministic visual noise — pixels but no glyphs.
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const v = Math.floor(rand() * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }
  const rgba = ctx.getImageData(0, 0, W, H).data;
  const rgb = Buffer.alloc(W * H * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    rgb[j++] = rgba[i];
    rgb[j++] = rgba[i + 1];
    rgb[j++] = rgba[i + 2];
  }
  return { rgb, W, H };
}

// Assemble a single-page PDF containing ONLY a FlateDecode DeviceRGB image.
async function buildImageOnlyPdf(lines, opts) {
  const { rgb, W, H } = await renderLinesToRgb(lines, opts);
  const compressed = zlib.deflateSync(rgb, { level: 6 });
  const contentStream = Buffer.from(`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`, 'ascii');

  const objects = [];
  objects[1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'ascii');
  objects[2] = Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>', 'ascii');
  objects[3] = Buffer.from(
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>',
    'ascii'
  );
  objects[4] = Buffer.concat([
    Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`,
      'ascii'
    ),
    compressed,
    Buffer.from('\nendstream', 'ascii'),
  ]);
  objects[5] = Buffer.concat([
    Buffer.from(`<< /Length ${contentStream.length} >>\nstream\n`, 'ascii'),
    contentStream,
    Buffer.from('\nendstream', 'ascii'),
  ]);

  const chunks = [Buffer.from('%PDF-1.4\n', 'ascii')];
  const offsets = [];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = chunks.reduce((n, c) => n + c.length, 0);
    chunks.push(Buffer.from(`${i} 0 obj\n`, 'ascii'), objects[i], Buffer.from('\nendobj\n', 'ascii'));
  }
  const xrefPos = chunks.reduce((n, c) => n + c.length, 0);
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, 'ascii'));
  return Buffer.concat(chunks);
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
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      res.end(serveBytes);
    });
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}/ethiojob/cvs/scanned.pdf`));
  });

// Runs the REAL uploadCV controller against a served scanned PDF.
const uploadCvFile = async (bufferOrName, fileName = 'cvcvcv.pdf') => {
  serveBytes = bufferOrName;
  const response = await invokeController(require('../controllers/authController').uploadCV, {
    user: { id: user._id.toString() },
    file: {
      path: `${baseUrl}/${encodeURIComponent(fileName)}`,
      filename: `ethiojob/cvs/${fileName.replace(/\.pdf$/, '')}`,
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

  const names = ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'FastAPI'];
  const skills = {};
  for (const n of names) skills[n] = await Skill.create({ name: n });

  const employer = await User.create({
    firstName: 'Employer',
    lastName: 'One',
    email: 'ocr-employer@demo.com',
    password: 'Password@123',
    role: 'employer',
    isEmailVerified: true,
  });
  const category = await Category.create({ name: 'Information Technology' });
  const company = await Company.create({
    name: 'Emare ICT Hub',
    owner: employer._id,
    email: 'hr-ocr@emare.example',
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
    email: 'ocr-pipeline@demo.com',
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

test(
  'B. scanned/image-only PDF: 1 page, embedded extraction empty, OCR fallback produces meaningful text',
  { timeout: 600000 },
  async () => {
    const scanned = await buildImageOnlyPdf(CV_A_LINES);

    // Direct probe of the REAL extraction pipeline (no mocks):
    // - proves the PDF has exactly 1 page
    // - proves embedded text layer yields ~0 characters
    // - proves OCR was attempted and produced meaningful text
    const { extractTextFromResumeUrl } = require('../utils/resumeParser');
    serveBytes = scanned;
    const extracted = await extractTextFromResumeUrl(`${baseUrl}/probe-scanned.pdf`);
    assert.equal(extracted.meta.fileType, 'pdf');
    assert.equal(extracted.meta.pages, 1); // PDF has 1 page
    assert.ok(extracted.meta.textSource === 'ocr'); // fallback was attempted AND used
    // textSource==='ocr' can only happen when embedded extraction was below
    // MIN_EMBEDDED_TEXT_CHARS (i.e. effectively 0 characters).
    assert.ok(extracted.text.trim().length >= 100); // meaningful OCR text

    // Now through the REAL upload controller.
    const body = await uploadCvFile(scanned, 'cvcvcv.pdf');
    assert.equal(body.parseStatus, 'ok');
    assert.ok(body.data.resumeAnalysis);
    assert.equal(body.data.resumeAnalysis.cvId, body.data.cvPublicId); // tagged to CURRENT file
    assert.equal(body.data.resumeAnalysis.textSource, 'ocr');
    assert.deepEqual([...body.data.resumeAnalysis.skillNames].sort(), [
      'CSS',
      'HTML',
      'JavaScript',
      'React',
      'TypeScript',
    ]);

    const data = await fetchDashboard();
    assert.equal(data.recommendationState, 'ready'); // canRecommendJobs === true
    assert.equal(data.canRecommend, true);
    assert.equal(data.resume.hasCV, true);
    assert.ok(data.recommendedJobs.length > 0);

    const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
    const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
    assert.ok(frontend.matchScore > backend.matchScore); // OCR-derived CV A favours frontend
    assert.ok(!JSON.stringify(frontend.matchedSkills).includes('Rust')); // no profile leak
  }
);

test('C. truly unreadable image (noise, no glyphs) → OCR finds nothing → recommendation still uses profile', { timeout: 600000 }, async () => {
  const noisePdf = await buildImageOnlyPdf([], { noise: true });
  const body = await uploadCvFile(noisePdf, 'noise.pdf');
  assert.notEqual(body.parseStatus, 'ok'); // OCR ran but found nothing usable

  const data = await fetchDashboard();
  // CV is unreadable but profile still provides recommendations.
  assert.equal(data.recommendationSource, 'profile');
  assert.equal(data.canRecommend, true);
  assert.ok(data.recommendedJobs.length > 0);
});

test('D. replace with scanned CV B → fresh OCR analysis replaces A, recommendations invert to B', { timeout: 600000 }, async () => {
  const bodyB = await uploadCvFile(await buildImageOnlyPdf(CV_B_LINES), 'scanned-b.pdf');
  assert.equal(bodyB.parseStatus, 'ok');
  assert.equal(bodyB.data.resumeAnalysis.textSource, 'ocr');
  assert.ok(bodyB.data.resumeAnalysis.skillNames.length >= 2, 'OCR detected at least some skills from scanned CV');
  assert.ok(bodyB.data.resumeAnalysis.skillNames.includes('Python'), 'Python detected from OCR');

  const data = await fetchDashboard();
  assert.equal(data.recommendationState, 'ready');
  const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
  const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.ok(backend.matchScore > frontend.matchScore); // inverted vs scanned A
});

test('E/F. remove scanned B → profile still provides; re-upload scanned A → identical deterministic scores', { timeout: 600000 }, async () => {
  const removeRes = await invokeController(require('../controllers/authController').deleteCV, {
    user: { id: user._id.toString() },
  });
  assert.equal(removeRes.statusCode, 200);
  const emptyData = await fetchDashboard();
  assert.equal(emptyData.recommendationSource, 'profile');
  assert.ok(emptyData.recommendedJobs.length > 0, 'profile still provides recommendations');

  const againBody = await uploadCvFile(await buildImageOnlyPdf(CV_A_LINES), 'cvcvcv.pdf');
  assert.equal(againBody.parseStatus, 'ok');
  assert.equal(againBody.data.resumeAnalysis.textSource, 'ocr');

  const firstRun = await fetchDashboard();
  assert.equal(firstRun.recommendationState, 'ready');
  const frontendFirst = firstRun.recommendedJobs.find((j) => j.title === 'Frontend Developer');

  const secondRun = await fetchDashboard();
  const frontendSecond = secondRun.recommendedJobs.find((j) => j.title === 'Frontend Developer');
  assert.equal(frontendFirst.matchScore, frontendSecond.matchScore); // deterministic from stored analysis
  assert.ok(frontendFirst.matchScore > 0);
});

test('H. profile noise and builder doc never affected OCR-CV recommendations', async () => {
  const doc = await User.findById(user._id).lean();
  assert.deepEqual(doc.technicalSkills, ['Rust']);
  assert.deepEqual(doc.softSkills, ['Leadership']);
  assert.equal(doc.experienceYears, doc.resumeAnalysis.experienceYears); // mirrors CURRENT CV, not profile's 12
  const Resume = require('../models/Resume');
  // Original builder cv + CV-upload-derived resumes (each upload creates a Resume Builder doc).
  const resumeCount = await Resume.countDocuments({ user: user._id });
  assert.ok(resumeCount >= 1, `at least one Resume exists (found ${resumeCount})`);

  // Stale identity rule: analysis from another file must NOT unlock.
  const { hasCurrentCvAnalysis } = require('../utils/dashboardHelpers');
  const staleUser = { ...doc, cvPublicId: 'ethiojob/cvs/DIFFERENT-file' };
  assert.equal(hasCurrentCvAnalysis(staleUser), false);
});

// REAL-FILE proof: runs the ACTUAL failing production PDF (e.g. the
// Microsoft-Print-To-PDF cvcvcv.pdf) through the complete chain —
// rasterization → OCR → analysis → cvId match → ready → recommendations —
// via the real controllers. Opt-in so personal documents are never committed:
//
//   $env:ETHIOJOB_REAL_CV_PDF = "C:\path\to\cvcvcv(1).pdf"
//   node --test backend\tests\cvOcrPipeline.test.js
//
const REAL_CV = process.env.ETHIOJOB_REAL_CV_PDF;
test(
  'REAL. actual cvcvcv.pdf → rasterize → OCR → ready → Recommended Jobs',
  { skip: !REAL_CV, timeout: 900000 },
  async () => {
    const realBytes = require('fs').readFileSync(REAL_CV);
    const body = await uploadCvFile(realBytes, 'cvcvcv.pdf');

    // Normal extraction returned 0 chars for this file; OCR fallback must win.
    assert.equal(body.parseStatus, 'ok');
    assert.equal(body.data.resumeAnalysis.textSource, 'ocr');
    assert.ok(body.data.resumeAnalysis.cvId === body.data.cvPublicId); // tagged to CURRENT file
    // Meaningful OCR text produced structured signals:
    assert.ok((body.data.resumeAnalysis.skillNames || []).length > 0);
    // The CV's visible technical skills must be detected (safe names only).
    const detected = new Set(body.data.resumeAnalysis.skillNames);
    for (const expected of ['JavaScript', 'Node.js', 'HTML', 'CSS']) {
      assert.ok(detected.has(expected), `expected skill ${expected} missing`);
    }

    const data = await fetchDashboard();
    assert.equal(data.recommendationState, 'ready');
    assert.equal(data.canRecommend, true);
    assert.equal(data.resume.hasCV, true);
    assert.ok(data.recommendedJobs.length > 0); // populated when matching jobs exist

    const frontend = data.recommendedJobs.find((j) => j.title === 'Frontend Developer');
    const backend = data.recommendedJobs.find((j) => j.title === 'Backend Developer');
    assert.ok(frontend.matchScore > backend.matchScore); // JS/HTML/CSS CV favours frontend
    assert.ok(!JSON.stringify(frontend.matchedSkills).includes('Rust')); // profile excluded

    // Lifecycle on the REAL file: remove → profile still provides; re-upload → same score.
    const removeRes = await invokeController(require('../controllers/authController').deleteCV, {
      user: { id: user._id.toString() },
    });
    assert.equal(removeRes.statusCode, 200);
    const emptyData = await fetchDashboard();
    assert.equal(emptyData.recommendationSource, 'profile');
    assert.ok(emptyData.recommendedJobs.length > 0, 'profile still provides recommendations');

    const again = await uploadCvFile(realBytes, 'cvcvcv.pdf');
    assert.equal(again.parseStatus, 'ok');
    const run1 = await fetchDashboard();
    const run2 = await fetchDashboard();
    const f1 = run1.recommendedJobs.find((j) => j.title === 'Frontend Developer');
    const f2 = run2.recommendedJobs.find((j) => j.title === 'Frontend Developer');
    assert.equal(f1.matchScore, f2.matchScore); // deterministic from stored analysis
    assert.ok(f1.matchScore > 0);
  }
);
