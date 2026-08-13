// ============================================
// Seed Certificate Verification Demo Data
// Creates:
//   1. Trusted mock verification records (VerifiedCertificate)
//   2. Demo job seeker accounts
//   3. Demo verification history covering every scenario
//
// Run: npm run seed:certificates
// ============================================
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const User = require('../models/user');
const VerifiedCertificate = require('../models/VerifiedCertificate');
const CertificateVerification = require('../models/CertificateVerification');

const INSTITUTION = 'Debre Birhan University';

// Trusted records (mock source of truth)
const trustedRecords = [
  {
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
  },
  {
    certificateNumber: 'DBU-CERT-2026-00250',
    verificationCode: 'DBU-CERT-2026-00250',
    certificateId: 'DBU-CERT-2026-00250',
    studentId: 'DBU-IS-23456',
    fullName: 'Hanna Getachew',
    institution: INSTITUTION,
    program: 'Business Administration',
    certificateType: 'Degree Certificate',
    issueDate: new Date('2025-06-30'),
    graduationYear: '2025',
    status: 'VALID',
    dataSource: 'mock',
  },
  {
    certificateNumber: 'DBU-CERT-2025-00110',
    verificationCode: 'DBU-CERT-2025-00110',
    certificateId: 'DBU-CERT-2025-00110',
    studentId: 'DBU-CS-90876',
    fullName: 'Yonas Kassa',
    institution: INSTITUTION,
    program: 'Computer Science',
    certificateType: 'Degree Certificate',
    issueDate: new Date('2024-07-15'),
    graduationYear: '2024',
    status: 'VALID',
    dataSource: 'mock',
  },
  {
    certificateNumber: 'DBU-DIP-2024-00500',
    verificationCode: 'DBU-DIP-2024-00500',
    certificateId: 'DBU-DIP-2024-00500',
    studentId: 'DBU-IT-44521',
    fullName: 'Worku Alemu',
    institution: INSTITUTION,
    program: 'Information Technology',
    certificateType: 'Diploma Certificate',
    issueDate: new Date('2024-01-10'),
    graduationYear: '2024',
    status: 'VALID',
    dataSource: 'mock',
  },
  {
    certificateNumber: 'DBU-CERT-2023-00099',
    verificationCode: 'DBU-CERT-2023-00099',
    certificateId: 'DBU-CERT-2023-00099',
    studentId: 'DBU-ED-11223',
    fullName: 'Marta Bekele',
    institution: INSTITUTION,
    program: 'Education',
    certificateType: 'Degree Certificate',
    issueDate: new Date('2023-07-12'),
    graduationYear: '2023',
    status: 'REVOKED',
    dataSource: 'mock',
  },
];

const demoUsers = [
  { email: 'solomon@demo.com', firstName: 'Solomon', lastName: 'Tadesse' },
  { email: 'ahmed@demo.com', firstName: 'Ahmed', lastName: 'Ali' },
  { email: 'dawit@demo.com', firstName: 'Dawit', lastName: 'Alemu' },
  { email: 'sara@demo.com', firstName: 'Sara', lastName: 'Mohammed' },
];

const findOrCreateUser = async (u) => {
  let user = await User.findOne({ email: u.email });
  if (!user) {
    user = await User.create({
      ...u,
      password: 'Password@123',
      role: 'jobseeker',
      isEmailVerified: true,
      isActive: true,
    });
  }
  return user;
};

const upsertTrusted = async (record) => {
  await VerifiedCertificate.findOneAndUpdate(
    { certificateNumber: record.certificateNumber },
    record,
    { upsert: true, new: true }
  );
};

const seed = async () => {
  try {
    await connectDB();
    console.log('🗑️  Resetting certificate verification collections...');
    await VerifiedCertificate.deleteMany({ dataSource: 'mock' });
    await CertificateVerification.deleteMany({});

    console.log('🏛️  Seeding trusted mock verification records...');
    for (const record of trustedRecords) {
      await upsertTrusted(record);
    }
    console.log(`  → ${trustedRecords.length} trusted records`);

    console.log('👤 Seeding demo job seeker accounts...');
    const users = {};
    for (const u of demoUsers) {
      users[u.email] = await findOrCreateUser(u);
    }

    console.log('🧾 Seeding demo verification history...');

    // Scenario 1 — VALID: Solomon uploads his own genuine certificate
    const solomonTrusted = await VerifiedCertificate.findOne({ certificateNumber: 'DBU-CERT-2026-00125' });
    const verifiedLog = await CertificateVerification.findOneAndUpdate(
      { user: users['solomon@demo.com']._id, verificationNumber: 'DBU-CERT-2026-00125', verificationStatus: 'VERIFIED' },
      {
        user: users['solomon@demo.com']._id,
        certificate: solomonTrusted._id,
        verificationNumber: 'DBU-CERT-2026-00125',
        qrScanResult: { status: 'detected', raw: 'DBU-CERT-2026-00125', message: 'QR code detected and decoded.' },
        extractedData: {
          fullName: 'Solomon Tadesse',
          studentId: 'DBU-IS-12345',
          certificateNumber: 'DBU-CERT-2026-00125',
          institution: INSTITUTION,
          program: 'Information Systems',
          certificateType: 'Degree Certificate',
          issueDate: '2026-07-20',
          graduationYear: '2026',
        },
        declaredData: { fullName: 'Solomon Tadesse', studentId: 'DBU-IS-12345', certificateNumber: 'DBU-CERT-2026-00125' },
        uploadedData: {
          fullName: 'Solomon Tadesse',
          studentId: 'DBU-IS-12345',
          certificateNumber: 'DBU-CERT-2026-00125',
          institution: INSTITUTION,
          program: 'Information Systems',
          certificateType: 'Degree Certificate',
          issueDate: '2026-07-20',
          graduationYear: '2026',
        },
        trustedRecord: {
          fullName: 'Solomon Tadesse',
          studentId: 'DBU-IS-12345',
          certificateNumber: 'DBU-CERT-2026-00125',
          institution: INSTITUTION,
          program: 'Information Systems',
          certificateType: 'Degree Certificate',
          issueDate: '2026-07-20',
          graduationYear: '2026',
        },
        profileData: { fullName: 'Solomon Tadesse', email: 'solomon@demo.com', phone: '' },
        profileMismatchedFields: [],
        verificationScore: 95,
        verificationStatus: 'VERIFIED',
        mismatchedFields: [],
        reason: 'All important certificate fields match the trusted institution record.',
        isDuplicate: false,
        reviewStatus: 'verified',
        verifiedAt: new Date(),
        reviewedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Scenario 2 & 4 — SUSPICIOUS + DUPLICATE: Ahmed Ali submits Solomon's certificate
    const duplicateLog = await CertificateVerification.findOneAndUpdate(
      { user: users['ahmed@demo.com']._id, verificationNumber: 'DBU-CERT-2026-00125', verificationStatus: 'SUSPICIOUS' },
      {
        user: users['ahmed@demo.com']._id,
        certificate: solomonTrusted._id,
        verificationNumber: 'DBU-CERT-2026-00125',
        qrScanResult: { status: 'detected', raw: 'DBU-CERT-2026-00125', message: 'QR code detected and decoded.' },
        extractedData: {
          fullName: 'Ahmed Ali',
          studentId: 'DBU-IS-12345',
          certificateNumber: 'DBU-CERT-2026-00125',
          institution: INSTITUTION,
          program: 'Information Systems',
          certificateType: 'Degree Certificate',
          issueDate: '2026-07-20',
          graduationYear: '2026',
        },
        declaredData: { fullName: 'Ahmed Ali', studentId: 'DBU-IS-12345', certificateNumber: 'DBU-CERT-2026-00125' },
        uploadedData: {
          fullName: 'Ahmed Ali',
          studentId: 'DBU-IS-12345',
          certificateNumber: 'DBU-CERT-2026-00125',
          institution: INSTITUTION,
          program: 'Information Systems',
          certificateType: 'Degree Certificate',
          issueDate: '2026-07-20',
          graduationYear: '2026',
        },
        trustedRecord: {
          fullName: 'Solomon Tadesse',
          studentId: 'DBU-IS-12345',
          certificateNumber: 'DBU-CERT-2026-00125',
          institution: INSTITUTION,
          program: 'Information Systems',
          certificateType: 'Degree Certificate',
          issueDate: '2026-07-20',
          graduationYear: '2026',
        },
        verificationStatus: 'SUSPICIOUS',
        mismatchedFields: [{ field: 'fullName', label: 'Name', uploaded: 'Ahmed Ali', trusted: 'Solomon Tadesse' }],
        reason: 'One or more important certificate fields do not match the trusted record: Name.',
        profileData: { fullName: 'Ahmed Ali', email: 'ahmed@demo.com', phone: '' },
        profileMismatchedFields: [],
        verificationScore: 70,
        isDuplicate: true,
        duplicateOfUser: users['solomon@demo.com']._id,
        reviewStatus: 'pending',
      },
      { upsert: true, new: true }
    );

    // Scenario 3 — INVALID: Sara submits an unknown verification number
    await CertificateVerification.findOneAndUpdate(
      { user: users['sara@demo.com']._id, verificationNumber: 'DBU-CERT-9999-99999', verificationStatus: 'INVALID' },
      {
        user: users['sara@demo.com']._id,
        certificate: null,
        verificationNumber: 'DBU-CERT-9999-99999',
        qrScanResult: { status: 'detected', raw: 'DBU-CERT-9999-99999', message: 'QR code detected and decoded.' },
        extractedData: { fullName: 'Sara Mohammed', certificateNumber: 'DBU-CERT-9999-99999' },
        declaredData: { fullName: 'Sara Mohammed', certificateNumber: 'DBU-CERT-9999-99999' },
        uploadedData: { fullName: 'Sara Mohammed', certificateNumber: 'DBU-CERT-9999-99999' },
        trustedRecord: {},
        verificationStatus: 'INVALID',
        mismatchedFields: [],
        reason: 'Certificate verification number was not found in the trusted verification database.',
        profileData: { fullName: 'Sara Mohammed', email: 'sara@demo.com', phone: '' },
        profileMismatchedFields: [],
        verificationScore: 0,
        isDuplicate: false,
        reviewStatus: 'pending',
      },
      { upsert: true, new: true }
    );

    // Scenario 5 — PENDING_REVIEW: Dawit's certificate has no readable QR
    await CertificateVerification.findOneAndUpdate(
      { user: users['dawit@demo.com']._id, verificationStatus: 'PENDING_REVIEW' },
      {
        user: users['dawit@demo.com']._id,
        certificate: null,
        verificationNumber: '',
        qrScanResult: { status: 'not_detected', raw: '', message: 'No QR code was detected in the image.' },
        extractedData: {},
        declaredData: { fullName: 'Dawit Alemu' },
        uploadedData: { fullName: 'Dawit Alemu' },
        trustedRecord: {},
        verificationStatus: 'PENDING_REVIEW',
        mismatchedFields: [],
        reason: 'The certificate does not contain a readable QR code or verification number. Manual verification is required.',
        profileData: { fullName: 'Dawit Alemu', email: 'dawit@demo.com', phone: '' },
        profileMismatchedFields: [],
        verificationScore: 0,
        isDuplicate: false,
        reviewStatus: 'pending',
      },
      { upsert: true, new: true }
    );

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║       ✅  CERTIFICATE DEMO DATA SEEDED!  ✅                ║
║                                                              ║
║   Trusted mock records: ${(await VerifiedCertificate.countDocuments({ dataSource: 'mock' })).toString().padEnd(4)}                          ║
║   Verification logs:    ${(await CertificateVerification.countDocuments()).toString().padEnd(4)}                          ║
║                                                              ║
║   Demo login accounts (Password@123):                        ║
║   Solomon Tadesse  - solomon@demo.com  (Scenario 1: VALID)  ║
║   Ahmed Ali        - ahmed@demo.com    (Scenarios 2&4: SUSPICIOUS/DUPLICATE) ║
║   Sara Mohammed    - sara@demo.com     (Scenario 3: INVALID) ║
║   Dawit Alemu      - dawit@demo.com    (Scenario 5: PENDING REVIEW) ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(0);
  } catch (err) {
    console.error('❌ Certificate seeding error:', err);
    process.exit(1);
  }
};

seed();