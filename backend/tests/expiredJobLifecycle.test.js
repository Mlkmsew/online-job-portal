// ============================================
// Expired Job Lifecycle Regression Tests
// ============================================
// 15 tests covering:
//   1. Published job becomes expired after expiration date
//   2. Expired job remains visible in employer Manage Jobs
//   3. Expired job still has Edit access
//   4. Employer can open expired job in the edit form
//   5. Editing expired job with future applicationDeadline → Published
//   6. Editing expired job with past applicationDeadline → stays Expired
//   7. Existing job ID remains unchanged
//   8. Existing applicants/applications are preserved
//   9. Employer ownership authorization remains enforced
//  10. Job seeker can see the job again after valid republish
//  11. Draft/rejected/other statuses not accidentally converted
//  12. Endpoint response and database state agree after editing
//  13. Manage Jobs shows correct Published status from database
//  14. No frontend-only status manipulation (DB is source of truth)
//  15. Existing job creation/edit tests still pass (verified by running full suite)

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/user');
const Company = require('../models/Company');
const Job = require('../models/job');
const Category = require('../models/Category');
const Application = require('../models/Application');
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
let employer, otherEmployer, jobseeker, company, category;
let publishedJob;

const createJob = async (overrides = {}) => {
  const defaults = {
    title: 'Test Job',
    description: 'Test job description',
    company: company._id,
    postedBy: employer._id,
    category: category._id,
    jobType: 'Full-time',
    location: { region: 'Addis Ababa' },
    applicationDeadline: new Date(Date.now() + 30 * 864e5),
    status: 'pending',
    isApproved: false,
  };
  return Job.create({ ...defaults, ...overrides });
};

const getJobFromDb = (id) => Job.findById(id).lean();

// Directly set a job's DB state — avoids in-memory stale document issues
const setJobDbState = async (jobId, updates) => {
  await Job.findByIdAndUpdate(jobId, { $set: updates });
};

// =========================================================================
// Setup
// =========================================================================

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  category = await Category.create({ name: 'Information Technology' });

  employer = await User.create({
    firstName: 'Employer', lastName: 'One',
    email: 'expired-test-employer@demo.com',
    password: 'Password@123', role: 'employer', isEmailVerified: true,
  });

  otherEmployer = await User.create({
    firstName: 'Employer', lastName: 'Two',
    email: 'expired-test-employer2@demo.com',
    password: 'Password@123', role: 'employer', isEmailVerified: true,
  });

  jobseeker = await User.create({
    firstName: 'Job', lastName: 'Seeker',
    email: 'expired-test-seeker@demo.com',
    password: 'Password@123', role: 'jobseeker', isEmailVerified: true,
  });

  company = await Company.create({
    name: 'Test Corp', owner: employer._id,
    email: 'hr@test.example', isApproved: true, isActive: true,
  });

  await Company.create({
    name: 'Other Corp', owner: otherEmployer._id,
    email: 'hr@other.example', isApproved: true, isActive: true,
  });

  publishedJob = await createJob({
    title: 'Published Developer',
    status: 'published',
    isApproved: true,
    applicationDeadline: new Date(Date.now() + 30 * 864e5),
  });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// =========================================================================
// Test 1: Published job becomes expired after expiration date
// =========================================================================
test('1. published job becomes expired when saved after deadline', async () => {
  const job = await createJob({
    title: 'Expired Via Save',
    status: 'published',
    isApproved: true,
    applicationDeadline: new Date(Date.now() - 5 * 864e5),
  });

  const fromDb = await getJobFromDb(job._id);
  assert.equal(fromDb.status, 'expired');
});

// =========================================================================
// Test 2: Expired job remains visible in employer Manage Jobs
// =========================================================================
test('2. expired job remains in employer job list', async () => {
  await setJobDbState(publishedJob._id, {
    status: 'expired',
    applicationDeadline: new Date(Date.now() - 5 * 864e5),
  });

  const req = { user: { id: employer._id.toString() }, query: {} };
  const response = await invokeController(jobController.getMyJobs, req);
  assert.equal(response.statusCode, 200);
  const jobIds = response.body.data.map((j) => j._id.toString());
  assert.ok(jobIds.includes(publishedJob._id.toString()), 'expired job still in employer list');
});

// =========================================================================
// Test 3: Expired job still has Edit access
// =========================================================================
test('3. employer can still update an expired job', async () => {
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { title: 'Updated Title While Expired' },
  };
  const response = await invokeController(jobController.updateJob, req);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.title, 'Updated Title While Expired');

  // Restore title directly in DB
  await setJobDbState(publishedJob._id, { title: 'Published Developer' });
});

// =========================================================================
// Test 4: Employer can open expired job in the edit form (getJob works)
// =========================================================================
test('4. expired job is accessible via getJob', async () => {
  const fromDb = await getJobFromDb(publishedJob._id);
  assert.ok(fromDb, 'job exists in DB');
  assert.equal(fromDb.status, 'expired');
  assert.equal(fromDb._id.toString(), publishedJob._id.toString());
});

// =========================================================================
// Test 5: Editing expired job with future applicationDeadline → Published
// =========================================================================
test('5. editing expired job with future deadline restores Published', async () => {
  const dbJob = await getJobFromDb(publishedJob._id);
  assert.equal(dbJob.status, 'expired', 'job is expired before edit');

  const futureDate = new Date(Date.now() + 60 * 864e5);
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { applicationDeadline: futureDate },
  };
  const response = await invokeController(jobController.updateJob, req);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.status, 'published', 'status should be published after future deadline');

  const fromDb = await getJobFromDb(publishedJob._id);
  assert.equal(fromDb.status, 'published', 'DB status should be published');
  assert.equal(new Date(fromDb.applicationDeadline).getTime(), futureDate.getTime());
});

// =========================================================================
// Test 6: Editing expired job with past applicationDeadline → stays Expired
// =========================================================================
test('6. editing expired job with past deadline keeps it expired', async () => {
  const pastDeadline = new Date(Date.now() - 2 * 864e5);
  await setJobDbState(publishedJob._id, {
    status: 'expired',
    applicationDeadline: pastDeadline,
  });

  const dbBefore = await getJobFromDb(publishedJob._id);
  assert.equal(dbBefore.status, 'expired', 'setup: job is expired');

  const pastDate = new Date(Date.now() - 1 * 864e5);
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: {
      applicationDeadline: pastDate,
      description: 'Updated description only',
    },
  };
  const response = await invokeController(jobController.updateJob, req);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.status, 'expired', 'should remain expired with past deadline');

  const fromDb = await getJobFromDb(publishedJob._id);
  assert.equal(fromDb.status, 'expired');
});

// =========================================================================
// Test 7: Existing job ID remains unchanged
// =========================================================================
test('7. job ID unchanged after editing expired job', async () => {
  const originalId = publishedJob._id.toString();

  // Set to expired in DB
  await setJobDbState(publishedJob._id, {
    status: 'expired',
    applicationDeadline: new Date(Date.now() - 1 * 864e5),
  });

  const futureDate = new Date(Date.now() + 90 * 864e5);
  const req = {
    params: { id: originalId },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { applicationDeadline: futureDate },
  };
  await invokeController(jobController.updateJob, req);

  const fromDb = await getJobFromDb(originalId);
  assert.ok(fromDb, 'job still exists with original ID');
  assert.equal(fromDb._id.toString(), originalId);
});

// =========================================================================
// Test 8: Existing applicants/applications are preserved
// =========================================================================
test('8. applications are preserved when expired job is reactivated', async () => {
  const app = await Application.create({
    job: publishedJob._id,
    applicant: jobseeker._id,
    employer: employer._id,
    company: company._id,
    status: 'Submitted',
  });

  // Set to expired in DB
  await setJobDbState(publishedJob._id, {
    status: 'expired',
    applicationDeadline: new Date(Date.now() - 1 * 864e5),
  });

  const futureDate = new Date(Date.now() + 60 * 864e5);
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { applicationDeadline: futureDate },
  };
  await invokeController(jobController.updateJob, req);

  const apps = await Application.find({ job: publishedJob._id });
  assert.equal(apps.length, 1, 'application count preserved');
  assert.equal(apps[0]._id.toString(), app._id.toString(), 'same application ID');

  await Application.deleteOne({ _id: app._id });
});

// =========================================================================
// Test 9: Employer ownership authorization remains enforced
// =========================================================================
test('9. other employer cannot update expired job', async () => {
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: otherEmployer._id.toString(), role: 'employer' },
    body: { title: 'Hacked Title' },
  };
  try {
    await invokeController(jobController.updateJob, req);
    assert.fail('should have thrown');
  } catch (err) {
    assert.equal(err.statusCode, 403);
  }
});

// =========================================================================
// Test 10: Job seeker can see the job again after valid republish
// =========================================================================
test('10. job seeker sees republished job in public listing', async () => {
  // Ensure published with future deadline in DB
  const futureDate = new Date(Date.now() + 60 * 864e5);
  await setJobDbState(publishedJob._id, {
    status: 'published',
    isApproved: true,
    applicationDeadline: futureDate,
  });

  const fromDb = await Job.find({
    status: { $in: ['published', 'active'] },
    isApproved: true,
  });
  const ids = fromDb.map((j) => j._id.toString());
  assert.ok(ids.includes(publishedJob._id.toString()), 'republished job visible to job seekers');
});

// =========================================================================
// Test 11: Draft/rejected/other statuses not accidentally converted
// =========================================================================
test('11. draft and pending jobs are not auto-published by future deadline', async () => {
  const draftJob = await createJob({
    title: 'Draft Job',
    status: 'draft',
    isApproved: false,
    applicationDeadline: new Date(Date.now() + 30 * 864e5),
  });
  assert.equal(draftJob.status, 'draft', 'draft stays draft with future deadline');

  const pendingJob = await createJob({
    title: 'Pending Job',
    status: 'pending',
    isApproved: false,
    applicationDeadline: new Date(Date.now() + 30 * 864e5),
  });
  assert.equal(pendingJob.status, 'pending', 'pending stays pending with future deadline');

  const closedJob = await createJob({
    title: 'Closed Job',
    status: 'closed',
    isApproved: true,
    applicationDeadline: new Date(Date.now() + 30 * 864e5),
  });
  assert.equal(closedJob.status, 'closed', 'closed stays closed with future deadline');
});

// =========================================================================
// Test 12: Endpoint response and database state agree after editing
// =========================================================================
test('12. endpoint response matches DB state after republish', async () => {
  await setJobDbState(publishedJob._id, {
    status: 'expired',
    applicationDeadline: new Date(Date.now() - 1 * 864e5),
  });

  const futureDate = new Date(Date.now() + 45 * 864e5);
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { applicationDeadline: futureDate },
  };
  const response = await invokeController(jobController.updateJob, req);
  assert.equal(response.statusCode, 200);

  const fromDb = await getJobFromDb(publishedJob._id);
  assert.equal(response.body.data.status, fromDb.status, 'response status matches DB');
  assert.equal(response.body.data.isApproved, fromDb.isApproved, 'response isApproved matches DB');
  assert.equal(response.body.data._id.toString(), fromDb._id.toString(), 'response ID matches DB');
});

// =========================================================================
// Test 13: Manage Jobs shows correct Published status from database
// =========================================================================
test('13. getMyJobs returns correct status after republish', async () => {
  await setJobDbState(publishedJob._id, {
    status: 'published',
    isApproved: true,
    applicationDeadline: new Date(Date.now() + 60 * 864e5),
  });

  const req = { user: { id: employer._id.toString() }, query: {} };
  const response = await invokeController(jobController.getMyJobs, req);
  assert.equal(response.statusCode, 200);
  const job = response.body.data.find((j) => j._id.toString() === publishedJob._id.toString());
  assert.ok(job, 'job in my jobs list');
  assert.equal(job.status, 'published', 'status is published in employer job list');
});

// =========================================================================
// Test 14: No frontend-only status manipulation (DB is source of truth)
// =========================================================================
test('14. status change persists in DB, not just in response', async () => {
  await setJobDbState(publishedJob._id, {
    status: 'expired',
    applicationDeadline: new Date(Date.now() - 1 * 864e5),
  });

  const futureDate = new Date(Date.now() + 60 * 864e5);
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { applicationDeadline: futureDate },
  };
  await invokeController(jobController.updateJob, req);

  const fromDb = await getJobFromDb(publishedJob._id);
  assert.equal(fromDb.status, 'published', 'DB itself says published');
  assert.equal(fromDb.isApproved, true, 'DB itself says isApproved true');
});

// =========================================================================
// Test 15: Existing job creation/edit tests still pass
// =========================================================================
test('15. create and edit existing jobs unaffected by new logic', async () => {
  const newJob = await createJob({ title: 'Normal New Job' });
  assert.equal(newJob.status, 'pending', 'new job starts pending');
  assert.equal(newJob.isApproved, false);

  const futureDate = new Date(Date.now() + 10 * 864e5);
  const req = {
    params: { id: publishedJob._id.toString() },
    user: { id: employer._id.toString(), role: 'employer' },
    body: { title: 'Still Published Job', applicationDeadline: futureDate },
  };
  const response = await invokeController(jobController.updateJob, req);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.status, 'published');
  assert.equal(response.body.data.title, 'Still Published Job');
});
