const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/user');
const VerifiedCertificate = require('../models/VerifiedCertificate');
const CertificateVerification = require('../models/CertificateVerification');
const { runVerification } = require('../utils/certificateVerification');

const INSTITUTION = 'Debre Birhan University';

let mongod;
let solomon;
let ahmed;

const empty = {
  fullName: '',
  studentId: '',
  certificateNumber: '',
  institution: '',
  program: '',
  certificateType: '',
  issueDate: '',
  graduationYear: '',
  email: '',
  phone: '',
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  solomon = await User.create({
    firstName: 'Solomon',
    lastName: 'Tadesse',
    email: 'solomon@demo.com',
    password: 'Password@123',
    role: 'jobseeker',
    phone: '0912345678',
    isEmailVerified: true,
  });

  ahmed = await User.create({
    firstName: 'Ahmed',
    lastName: 'Ali',
    email: 'ahmed@demo.com',
    password: 'Password@123',
    role: 'jobseeker',
    phone: '0911111111',
    isEmailVerified: true,
  });

  await VerifiedCertificate.create({
    certificateNumber: 'DBU-CERT-2026-00125',
    verificationCode: 'DBU-CERT-2026-00125',
    certificateId: 'DBU-CERT-2026-00125',
    studentId: 'DBU-IS-12345',
    fullName: 'Solomon Tadesse',
    institution: INSTITUTION,
    program: 'Information Systems',
    certificateType: 'Degree Certificate',
    issueDate: new Date('2026-07-20'),
    graduationYear: '2026',
    status: 'VALID',
    dataSource: 'mock',
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('S1: owner uploads own genuine certificate → VERIFIED with high score', async () => {
  const result = await runVerification({
    applicant: solomon,
    extracted: {
      fullName: 'Solomon Tadesse',
      studentId: 'DBU-IS-12345',
      certificateNumber: 'DBU-CERT-2026-00125',
      institution: INSTITUTION,
      program: 'Information Systems',
      certificateType: 'Degree Certificate',
      issueDate: '2026-07-20',
      graduationYear: '2026',
      email: '',
      phone: '',
    },
    declared: {},
    qrScanResult: { status: 'detected', raw: 'DBU-CERT-2026-00125', message: 'OK' },
    verificationNumber: 'DBU-CERT-2026-00125',
  });

  assert.equal(result.verificationStatus, 'VERIFIED');
  assert.equal(result.isDuplicate, false);
  assert.deepEqual(result.profileMismatchedFields, []);
  assert.ok(result.verificationScore >= 80, `expected high score, got ${result.verificationScore}`);
});

test('S2: another user submits an unmodified certificate → SUSPICIOUS (identity + profile)', async () => {
  const result = await runVerification({
    applicant: ahmed,
    extracted: {
      fullName: 'Solomon Tadesse',
      studentId: 'DBU-IS-12345',
      certificateNumber: 'DBU-CERT-2026-00125',
      institution: INSTITUTION,
      program: 'Information Systems',
      certificateType: 'Degree Certificate',
      email: '',
      phone: '',
    },
    declared: {},
    qrScanResult: { status: 'detected', raw: 'DBU-CERT-2026-00125', message: 'OK' },
    verificationNumber: 'DBU-CERT-2026-00125',
  });

  assert.equal(result.verificationStatus, 'SUSPICIOUS');
  assert.equal(result.isDuplicate, false);
  const nameMismatch = result.mismatchedFields.some((m) => m.field === 'fullName');
  const profileNameMismatch = result.profileMismatchedFields.some((m) => m.field === 'fullName');
  assert.equal(nameMismatch, true);
  assert.equal(profileNameMismatch, true);
  assert.ok(result.verificationScore < 80, `expected reduced score, got ${result.verificationScore}`);
});

test('S2b: duplicate detection once the same number is logged for another account', async () => {
  await CertificateVerification.create({
    user: solomon._id,
    verificationNumber: 'DBU-CERT-2026-00125',
    verificationStatus: 'VERIFIED',
    uploadedData: { fullName: 'Solomon Tadesse' },
    qrScanResult: { status: 'detected', raw: 'DBU-CERT-2026-00125', message: 'OK' },
  });

  const result = await runVerification({
    applicant: ahmed,
    extracted: {
      fullName: 'Solomon Tadesse',
      certificateNumber: 'DBU-CERT-2026-00125',
      email: '',
      phone: '',
    },
    declared: {},
    qrScanResult: { status: 'detected', raw: 'DBU-CERT-2026-00125', message: 'OK' },
    verificationNumber: 'DBU-CERT-2026-00125',
  });

  assert.equal(result.isDuplicate, true);
  assert.equal(result.duplicateOfUser.toString(), solomon._id.toString());
});

test('S3: unknown verification number → INVALID with zero score', async () => {
  const result = await runVerification({
    applicant: ahmed,
    extracted: { fullName: 'Ahmed Ali', email: '', phone: '' },
    declared: {},
    qrScanResult: { status: 'detected', raw: 'DBU-CERT-9999-99999', message: 'OK' },
    verificationNumber: 'DBU-CERT-9999-99999',
  });

  assert.equal(result.verificationStatus, 'INVALID');
  assert.equal(result.verificationScore, 0);
});

test('S5: no verification number → PENDING_REVIEW with zero score', async () => {
  const result = await runVerification({
    applicant: solomon,
    extracted: { ...empty },
    declared: {},
    qrScanResult: { status: 'not_detected', raw: '', message: 'none' },
    verificationNumber: '',
  });

  assert.equal(result.verificationStatus, 'PENDING_REVIEW');
  assert.equal(result.verificationScore, 0);
});