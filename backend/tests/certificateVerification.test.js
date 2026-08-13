const test = require('node:test');
const assert = require('node:assert/strict');
const {
  compareField,
  compareProfileField,
  buildUploadedData,
  buildProfileData,
  buildDocumentProfile,
  computeScore,
  IMPORTANT_FIELDS,
  PROFILE_FIELDS,
} = require('../utils/certificateVerification');

const trustedSolomon = {
  fullName: 'Solomon Tadesse',
  studentId: 'DBU-IS-12345',
  certificateNumber: 'DBU-CERT-2026-00125',
  institution: 'Debre Birhan University',
  program: 'Information Systems',
  certificateType: 'Degree Certificate',
  issueDate: '2026-07-20',
  graduationYear: '2026',
};

test('buildUploadedData merges email and phone from extracted + declared + account', () => {
  const uploaded = buildUploadedData({
    extracted: { fullName: 'Solomon Tadesse', email: 'solomon@uni.edu' },
    declared: { phone: '0912345678' },
    account: { firstName: 'Solomon', lastName: 'Tadesse', email: 'solomon@demo.com', phone: '0912345678' },
  });
  assert.equal(uploaded.fullName, 'Solomon Tadesse');
  assert.equal(uploaded.email, 'solomon@uni.edu');
  assert.equal(uploaded.phone, '0912345678');
});

test('compareProfileField normalizes email case and phone digits', () => {
  assert.equal(compareProfileField('email', 'SOLOMON@Demo.COM', 'solomon@demo.com'), true);
  assert.equal(compareProfileField('phone', '+251 91 234 5678', '0912345678'), true);
  assert.equal(compareProfileField('phone', '0912345678', '0911111111'), false);
  assert.equal(compareProfileField('email', '', 'solomon@demo.com'), null);
  assert.equal(compareProfileField('email', 'solomon@demo.com', ''), null);
});

test('computeScore gives a high score when everything matches', () => {
  const score = computeScore({
    uploaded: { ...trustedSolomon, email: 'solomon@demo.com', phone: '0912345678' },
    trusted: trustedSolomon,
    profileFromAccount: { fullName: 'Solomon Tadesse', email: 'solomon@demo.com', phone: '0912345678' },
    profileFromDocument: { fullName: 'Solomon Tadesse', email: 'solomon@demo.com', phone: '0912345678' },
    mismatchedKeys: new Set(),
    profileMismatchedKeys: new Set(),
  });
  assert.ok(score >= 95, `expected high score, got ${score}`);
});

test('computeScore is reduced by a name mismatch on the certificate', () => {
  const score = computeScore({
    uploaded: { ...trustedSolomon, fullName: 'Ahmed Ali' },
    trusted: trustedSolomon,
    profileFromAccount: { fullName: 'Ahmed Ali', email: 'ahmed@demo.com', phone: '' },
    profileFromDocument: { fullName: 'Ahmed Ali', email: '', phone: '' },
    mismatchedKeys: new Set(['fullName']),
    profileMismatchedKeys: new Set(),
  });
  assert.ok(score < 80, `expected reduced score, got ${score}`);
});

test('profile fields include Name, Email and Phone', () => {
  assert.deepEqual(
    PROFILE_FIELDS.map((f) => f.key),
    ['fullName', 'email', 'phone']
  );
});

test('important fields still cover certificate identity fields', () => {
  const keys = IMPORTANT_FIELDS.map((f) => f.key);
  assert.ok(keys.includes('fullName'));
  assert.ok(keys.includes('certificateNumber'));
  assert.ok(keys.includes('studentId'));
});

test('buildProfileData reads the registered account', () => {
  assert.deepEqual(buildProfileData({ firstName: 'Solomon', lastName: 'Tadesse', email: 's@d.com', phone: '09' }), {
    fullName: 'Solomon Tadesse',
    email: 's@d.com',
    phone: '09',
  });
});

test('buildDocumentProfile reads document/declared identity', () => {
  assert.deepEqual(
    buildDocumentProfile({ extracted: { fullName: 'Solomon Tadesse', email: 's@u.edu' }, declared: { phone: '09' } }),
    { fullName: 'Solomon Tadesse', email: 's@u.edu', phone: '09' }
  );
});