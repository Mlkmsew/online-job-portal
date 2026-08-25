const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Stub Cloudinary BEFORE the controller lazily requires it so no network call
// is made and we can assert which public ID was destroyed.
const cloudinary = require('cloudinary').v2;
let destroyedIds = [];
cloudinary.uploader.destroy = async (publicId) => {
  destroyedIds.push(publicId);
  return { result: 'ok' };
};

const User = require('../models/user');
const authController = require('../controllers/authController');
const { hasProfileOrResumeData } = require('../utils/dashboardHelpers');

// helpers.asyncHandler is fire-and-forget (returns undefined), so completion
// must be observed through the res/next callbacks.
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
let owner;
let otherUser;

// Everything that must survive a CV removal (profile + builder sections).
// resumeAnalysis is intentionally NOT here — it is a cache derived from the
// removed CV and must be cleared so it cannot power recommendations.
const PROFILE_SNAPSHOT_KEYS = [
  'skillNames',
  'technicalSkills',
  'softSkills',
  'languages',
  'portfolio',
  'experienceDetails',
  'educationDetails',
];

const snapshotProfile = (doc) => {
  const picked = {};
  PROFILE_SNAPSHOT_KEYS.forEach((key) => {
    picked[key] = JSON.parse(JSON.stringify(doc[key] ?? null));
  });
  return picked;
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  owner = await User.create({
    firstName: 'Solomon',
    lastName: 'Tadesse',
    email: 'solomon@demo.com',
    password: 'Password@123',
    role: 'jobseeker',
    isEmailVerified: true,
    cv: 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/cv-123.pdf',
    cvPublicId: 'ethiojob/cvs/cv-123',
    cvOriginalName: 'my-cv.pdf',
    skillNames: ['React', 'Node.js'],
    technicalSkills: ['React'],
    softSkills: ['Teamwork'],
    languages: [{ name: 'Amharic', level: 'Native' }],
    portfolio: [{ label: 'GitHub', url: 'https://github.com/solomon' }],
    experienceDetails: [{ title: 'Developer', company: 'Acme', description: 'Built things' }],
    educationDetails: [{ degree: 'BSc', institution: 'AAU' }],
    resumeAnalysis: { education: ['BSc'], experienceYears: 3, certifications: ['AWS'] },
  });

  // A second account that must never be able to touch Solomon's CV.
  otherUser = await User.create({
    firstName: 'Ahmed',
    lastName: 'Ali',
    email: 'ahmed@demo.com',
    password: 'Password@123',
    role: 'employer',
    isEmailVerified: true,
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('owner removes their own uploaded CV successfully', async () => {
  const response = await invokeController(authController.deleteCV, {
    user: { id: owner._id.toString() },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.match(response.body.message, /CV removed/i);

  const updated = await User.findById(owner._id);
  assert.equal(updated.cv, undefined);
  assert.equal(updated.cvPublicId, undefined);
  assert.equal(updated.cvOriginalName, undefined);
  // The parsed-CV cache is cleared so it cannot power recommendations.
  // ($unset leaves an empty schema shell behind; assert semantic emptiness.)
  assert.equal(updated.resumeAnalysis?.experienceYears ?? null, null);
  assert.equal((updated.resumeAnalysis?.skills || []).length, 0);
  // The detach lock is set — profile/builder data must not act as a CV.
  assert.ok(updated.cvDetachedAt);
  // The stored Cloudinary file was destroyed via its public ID.
  assert.deepEqual(destroyedIds, ['ethiojob/cvs/cv-123']);
});

test("another authenticated user cannot remove someone else's CV", async () => {
  // Give Solomon a fresh CV reference.
  const solomon = await User.findById(owner._id);
  solomon.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/private.pdf';
  solomon.cvPublicId = 'ethiojob/cvs/private';
  solomon.cvOriginalName = 'private.pdf';
  await solomon.save({ validateBeforeSave: false });

  // Ahmed (an employer) calls the endpoint — it may only affect his own doc,
  // and since he has no CV it is a graceful no-op for him.
  const response = await invokeController(authController.deleteCV, {
    user: { id: otherUser._id.toString() },
  });
  assert.equal(response.statusCode, 200);

  const after = await User.findById(owner._id);
  assert.equal(after.cv, 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/private.pdf');
  assert.equal(after.cvPublicId, 'ethiojob/cvs/private');

  destroyedIds.length = 0;
});

test('removing when no CV exists is a graceful no-op', async () => {
  const response = await invokeController(authController.deleteCV, {
    user: { id: otherUser._id.toString() },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.match(response.body.message, /No CV document uploaded/i);
  assert.deepEqual(destroyedIds, []);
});

test('Resume Builder / profile data remains intact after removal', async () => {
  // Re-add a CV so there is something to remove.
  const solomon = await User.findById(owner._id);
  solomon.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/again.pdf';
  solomon.cvPublicId = 'ethiojob/cvs/again';
  solomon.cvOriginalName = 'again.pdf';
  await solomon.save({ validateBeforeSave: false });

  const before = await User.findById(owner._id).lean();
  const snapshot = snapshotProfile(before);

  const response = await invokeController(authController.deleteCV, {
    user: { id: owner._id.toString() },
  });
  assert.equal(response.statusCode, 200);

  const after = await User.findById(owner._id).lean();
  PROFILE_SNAPSHOT_KEYS.forEach((key) => {
    assert.deepEqual(
      JSON.parse(JSON.stringify(after[key] ?? null)),
      snapshot[key],
      `${key} must be unchanged`
    );
  });
});

test('removing the CV preserves profile data; recommendations can still come from profile', async () => {
  // Seed the exact post-upload state: document + parsed cache + profile data.
  const solomon = await User.findById(owner._id);
  solomon.cv = 'https://res.cloudinary.com/demo/raw/upload/ethiojob/cvs/lock.pdf';
  solomon.cvPublicId = 'ethiojob/cvs/lock';
  solomon.cvOriginalName = 'lock.pdf';
  solomon.resumeAnalysis = { education: ['BSc'], experienceYears: 3, certifications: ['AWS'] };
  solomon.skillNames = ['React', 'Node.js'];
  solomon.technicalSkills = ['React'];
  await solomon.save({ validateBeforeSave: false });

  const response = await invokeController(authController.deleteCV, {
    user: { id: owner._id.toString() },
  });
  assert.equal(response.statusCode, 200);

  const afterDoc = (await User.findById(owner._id)).toObject();
  assert.equal(afterDoc.resumeAnalysis?.experienceYears ?? null, null);
  assert.ok(afterDoc.cvDetachedAt);

  // Profile skills survived…
  assert.deepEqual(afterDoc.skillNames, ['React', 'Node.js']);
  assert.deepEqual(afterDoc.technicalSkills, ['React']);

  // …and profile data is sufficient for recommendations (Resume Builder + Profile source).
  assert.equal(hasProfileOrResumeData(afterDoc), true);
});

test('unknown user id is rejected with 404', async () => {
  await assert.rejects(
    invokeController(authController.deleteCV, {
      user: { id: new mongoose.Types.ObjectId().toString() },
    }),
    (err) => err.statusCode === 404 && /User not found/.test(err.message)
  );
});
