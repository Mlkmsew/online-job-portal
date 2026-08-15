const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const mongoose = require('mongoose');

const Application = require('../models/Application');
const { downloadResume } = require('../controllers/applicationController');
const { AppError } = require('../middleware/errorHandler');

const employerId = new mongoose.Types.ObjectId();
const otherEmployerId = new mongoose.Types.ObjectId();
const applicantId = new mongoose.Types.ObjectId();

let originalFetch;

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

const VALID_RESUME_URL = 'https://res.cloudinary.com/test-cloud/raw/upload/v1/ethiojob/cvs/abc123.pdf';

const makeRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    redirectedTo: null,
    sent: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    send(body) {
      this.sent = body;
      this.statusCode = 200;
    },
    download() {
      this.sent = true;
      this.statusCode = 200;
    },
    redirect(url) {
      this.redirectedTo = url;
      this.statusCode = 302;
    },
  };
  return res;
};

const fakeApplication = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  applicant: { _id: applicantId, firstName: 'Solomon', lastName: 'Tadesse' },
  company: { _id: new mongoose.Types.ObjectId() },
  employer: { _id: employerId },
  job: { _id: new mongoose.Types.ObjectId(), postedBy: employerId },
  resumeUrl: VALID_RESUME_URL,
  status: 'Submitted',
  ...overrides,
});

// asyncHandler does not return the handler promise (helpers.js), so let the
// microtask queue drain before asserting on async streaming work.
const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

test.beforeEach(() => {
  originalFetch = global.fetch;
});

test.afterEach(() => {
  mock.restoreAll();
  if (originalFetch !== undefined) {
    global.fetch = originalFetch;
  }
  delete process.env.CLOUDINARY_SECURE_DELIVERY;
});

test('downloadResume streams a valid Cloudinary resume for the authorized employer (200, no redirect)', async (t) => {
  const app = fakeApplication();
  mock.method(Application, 'findById', () => ({ populate: () => app }));

  global.fetch = async () => ({
    ok: true,
    arrayBuffer: async () => Buffer.from('fake-pdf-content'),
    headers: { get: () => 'application/pdf' },
  });

  const res = makeRes();
  let nextErr = null;
  await downloadResume(
    { params: { id: app._id.toString() }, user: { id: employerId.toString(), role: 'employer' } },
    res,
    (e) => { nextErr = e; }
  );
  await flush();

  assert.equal(nextErr, null);
  assert.equal(res.redirectedTo, null, 'must not redirect a valid Cloudinary resume');
  assert.equal(res.statusCode, 200);
  assert.ok(res.sent instanceof Buffer, 'resume body must be streamed to the client');
  assert.match(res.headers['Content-Disposition'] || '', /attachment; filename="Solomon-resume\.pdf"/);
});

test('downloadResume returns a controlled error (422) for an unsupported http(s) URL instead of redirecting', async (t) => {
  const app = fakeApplication({ resumeUrl: 'https://evil.example.com/resume.pdf' });
  mock.method(Application, 'findById', () => ({ populate: () => app }));

  const res = makeRes();
  let nextErr = null;
  await downloadResume(
    { params: { id: app._id.toString() }, user: { id: employerId.toString(), role: 'employer' } },
    res,
    (e) => { nextErr = e; }
  );

  assert.ok(nextErr instanceof AppError, 'expected an AppError');
  assert.equal(nextErr.statusCode, 422);
  assert.equal(res.redirectedTo, null, 'must not 302-redirect an unsupported URL');
  assert.equal(res.sent, null);
});

test('downloadResume rejects an employer who does not own the application (403)', async (t) => {
  const app = fakeApplication();
  mock.method(Application, 'findById', () => ({ populate: () => app }));

  const res = makeRes();
  let nextErr = null;
  await downloadResume(
    { params: { id: app._id.toString() }, user: { id: otherEmployerId.toString(), role: 'employer' } },
    res,
    (e) => { nextErr = e; }
  );

  assert.ok(nextErr instanceof AppError, 'expected an AppError');
  assert.equal(nextErr.statusCode, 403);
  assert.equal(res.redirectedTo, null);
});

test('downloadResume returns 404 when the application has no resume URL', async (t) => {
  const app = fakeApplication({ resumeUrl: null });
  app.applicant.cv = null;
  mock.method(Application, 'findById', () => ({ populate: () => app }));

  const res = makeRes();
  let nextErr = null;
  await downloadResume(
    { params: { id: app._id.toString() }, user: { id: employerId.toString(), role: 'employer' } },
    res,
    (e) => { nextErr = e; }
  );

  assert.ok(nextErr instanceof AppError, 'expected an AppError');
  assert.equal(nextErr.statusCode, 404);
});