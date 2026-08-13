// ============================================
// Certificate Verification Engine
// Implements the complete verification workflow:
//
//   Upload → Validate → Read → Detect QR → Decode →
//   Extract verification number → Search trusted DB →
//   Retrieve original record → Extract uploaded data →
//   Compare field-by-field → Compute result
//
// Rules:
//   Rule 1 - Valid certificate                → VERIFIED
//   Rule 2 - Modified certificate             → SUSPICIOUS
//   Rule 3 - Unknown verification number      → INVALID
//   Rule 4 - Duplicate certificate            → DUPLICATE flag (admin review)
//   Rule 5 - Missing/unreadable QR code       → PENDING_REVIEW (manual)
// ============================================
const { normalizeText } = require('./certificateParser');

// Important fields compared against the trusted record
const IMPORTANT_FIELDS = [
  { key: 'fullName', label: 'Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'certificateNumber', label: 'Certificate Number' },
  { key: 'institution', label: 'Institution' },
  { key: 'program', label: 'Program' },
  { key: 'certificateType', label: 'Certificate Type' },
  { key: 'issueDate', label: 'Issue Date' },
  { key: 'graduationYear', label: 'Graduation Year' },
];

// Job seeker profile fields compared against their registered account
// (CV/Resume consistency check — the document owner must match the applicant).
const PROFILE_FIELDS = [
  { key: 'fullName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

// Field weights used to compute the informational verification score.
// The score never decides the final status — the rules do.
const SCORE_WEIGHTS = {
  fullName: 20,
  studentId: 10,
  certificateNumber: 25,
  institution: 10,
  program: 10,
  certificateType: 5,
  issueDate: 5,
  graduationYear: 5,
  email: 5,
  phone: 5,
};

const CERTIFICATE_NUMBER_FIELD = 'certificateNumber';

const emptyFieldMap = () => ({
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
});

/**
 * Merge extracted + declared + account data into the effective values used for
 * comparison. Document extraction wins, then declared, then account fallback.
 */
const buildUploadedData = ({ extracted, declared, account }) => {
  const output = emptyFieldMap();

  const nameFromAccount = account
    ? [account.firstName, account.lastName].filter(Boolean).join(' ').trim()
    : '';

  output.fullName = extracted.fullName || declared.fullName || nameFromAccount;
  output.studentId = extracted.studentId || declared.studentId || '';
  output.certificateNumber = extracted.certificateNumber || declared.certificateNumber || '';
  output.institution = extracted.institution || declared.institution || '';
  output.program = extracted.program || declared.program || '';
  output.certificateType = extracted.certificateType || declared.certificateType || '';
  output.issueDate = extracted.issueDate || declared.issueDate || '';
  output.graduationYear = extracted.graduationYear || declared.graduationYear || '';
  output.email = extracted.email || declared.email || '';
  output.phone = extracted.phone || declared.phone || '';

  return output;
};

const pickTrusted = (record) => ({
  certificateNumber: record.certificateNumber || '',
  fullName: record.fullName || '',
  studentId: record.studentId || '',
  institution: record.institution || '',
  program: record.program || '',
  certificateType: record.certificateType || '',
  issueDate: record.issueDate ? new Date(record.issueDate).toISOString().slice(0, 10) : '',
  graduationYear: record.graduationYear ? String(record.graduationYear) : '',
});

/**
 * Normalize date-ish strings so "2026-07-20" and "2026-07-20T00:00:00.000Z"
 * or "20/07/2026" compare sensibly.
 */
const normalizeDateValue = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const m = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return normalizeText(raw);
};

const normalizeField = (fieldKey, value) => {
  const v = String(value || '').trim();
  if (!v) return '';
  if (fieldKey === 'issueDate') return normalizeDateValue(v);
  return normalizeText(v);
};

/**
 * Compare one uploaded value against the trusted value.
 * Empty uploaded values are treated as "not extractable" and do NOT count as a
 * mismatch by themselves (the certificate still goes to admin review via the
 * overall status logic in runVerification).
 */
const compareField = (fieldKey, uploaded, trusted) => {
  const u = normalizeField(fieldKey, uploaded);
  const t = normalizeField(fieldKey, trusted);
  if (!u) return null; // unknown → neutral
  return u === t;
};

/**
 * Registered account profile values used for the CV-consistency check.
 */
const buildProfileData = (account) => ({
  fullName: account ? [account.firstName, account.lastName].filter(Boolean).join(' ').trim() : '',
  email: (account && account.email) || '',
  phone: (account && account.phone) || '',
});

/**
 * Contact/identity values found on the uploaded document (or declared).
 */
const buildDocumentProfile = ({ extracted, declared }) => ({
  fullName: (extracted && extracted.fullName) || (declared && declared.fullName) || '',
  email: (extracted && extracted.email) || (declared && declared.email) || '',
  phone: (extracted && extracted.phone) || (declared && declared.phone) || '',
});

const normalizeProfileValue = (fieldKey, value) => {
  const v = String(value || '').trim();
  if (!v) return '';
  if (fieldKey === 'email') return v.toLowerCase();
  if (fieldKey === 'phone') {
    const digits = v.replace(/\D/g, '');
    // Normalize Ethiopian numbers so "+2519..." and "09..." are equivalent.
    return digits.startsWith('251') ? `0${digits.slice(3)}` : digits;
  }
  return normalizeText(v);
};

/**
 * Compare one document value against the registered account value.
 * Unknown document values are neutral; missing account values are neutral.
 */
const compareProfileField = (fieldKey, documentValue, accountValue) => {
  const d = normalizeProfileValue(fieldKey, documentValue);
  const a = normalizeProfileValue(fieldKey, accountValue);
  if (!d) return null; // not on the document → neutral
  if (!a) return null; // not on the account → neutral
  return d === a;
};

/**
 * Informational verification score (0-100). Weighted sum of the fields that
 * could be confirmed as matching. Identity (full name) requires the document
 * name AND the account owner to match the trusted owner — catching someone who
 * reuses another person's genuine certificate. Unknown fields earn half
 * weight. The score is advisory only and never determines the final status.
 */
const computeScore = ({ uploaded, trusted, profileFromAccount, profileFromDocument, mismatchedKeys, profileMismatchedKeys }) => {
  let earned = 0;
  let total = 0;

  // Certificate authenticity against the trusted record.
  IMPORTANT_FIELDS.forEach(({ key }) => {
    const weight = SCORE_WEIGHTS[key];
    if (!weight) return;
    const expected = trusted[key];
    if (!expected) return; // no trusted value to confirm against
    total += weight;

    if (key === 'fullName') {
      const docMatch = compareField('fullName', uploaded.fullName, expected);
      const accountMatch = compareField('fullName', profileFromAccount.fullName, expected);
      if (docMatch === true && accountMatch === true) {
        earned += weight;
      } else if (docMatch === null && accountMatch === true) {
        earned += weight / 2;
      }
      // any clear identity disagreement → 0
    } else if (mismatchedKeys.has(key)) {
      earned += 0;
    } else {
      const c = compareField(key, uploaded[key], expected);
      earned += c === true ? weight : c === null ? weight / 2 : 0;
    }
  });

  // Profile/CV contact consistency: document email/phone must match the
  // registered account. Identity (full name) is already handled above.
  PROFILE_FIELDS.forEach(({ key }) => {
    if (key === 'fullName') return;
    const weight = SCORE_WEIGHTS[key];
    if (!weight) return;
    const expected = profileFromAccount[key];
    if (!expected) return; // account has no value for this field
    total += weight;
    if (profileMismatchedKeys.has(key)) {
      earned += 0;
    } else {
      const c = compareProfileField(key, profileFromDocument[key], expected);
      earned += c === true ? weight : c === null ? weight / 2 : 0;
    }
  });

  return total ? Math.round((earned / total) * 100) : 0;
};

/**
 * Execute the verification workflow for one certificate submission.
 *
 * @param {Object} params
 * @param {Object} params.applicant  - Mongoose User document
 * @param {Object} params.extracted  - extracted data from document parser
 * @param {Object} params.declared   - data declared by the applicant
 * @param {Object} params.qrScanResult - { status, raw, message }
 * @param {string} params.verificationNumber - extracted verification number
 */
const runVerification = async ({ applicant, extracted, declared, qrScanResult, verificationNumber }) => {
  const VerifiedCertificate = require('../models/VerifiedCertificate');
  const CertificateVerification = require('../models/CertificateVerification');

  const normalizedNumber = (verificationNumber || '').trim().toUpperCase();

  // Profile/CV consistency data (used in every branch)
  const profileFromAccount = buildProfileData(applicant);
  const profileFromDocument = buildDocumentProfile({ extracted, declared });

  const buildProfileMismatches = (uploadedData, trusted) => {
    const mismatches = [];
    const profileMismatchedKeys = new Set();
    PROFILE_FIELDS.forEach(({ key, label }) => {
      const result = compareProfileField(key, profileFromDocument[key], profileFromAccount[key]);
      if (result === false) {
        mismatches.push({ field: key, label, uploaded: profileFromDocument[key], registered: profileFromAccount[key] });
        profileMismatchedKeys.add(key);
      }
    });
    const mismatchedKeys = new Set((uploadedData ? [] : []));
    // Gather trusted-record mismatches for the score (identity check included)
    IMPORTANT_FIELDS.forEach(({ key }) => {
      if (!trusted || !trusted[key]) return;
      const c = compareField(key, uploadedData[key], trusted[key]);
      if (c === false) mismatchedKeys.add(key);
    });
    // Account name vs trusted record identity check
    if (trusted && trusted.fullName && compareField('fullName', profileFromAccount.fullName, trusted.fullName) === false) {
      mismatchedKeys.add('fullName');
    }
    const score = computeScore({
      uploaded: uploadedData || emptyFieldMap(),
      trusted: trusted || emptyFieldMap(),
      profileFromAccount,
      profileFromDocument,
      mismatchedKeys,
      profileMismatchedKeys,
    });
    return { profileMismatchedFields: mismatches, verificationScore: score };
  };

  // ── Rule 5: no readable verification number / QR ────────────────────────
  if (!normalizedNumber) {
    const uploaded = buildUploadedData({ extracted, declared, account: applicant });
    const { profileMismatchedFields } = buildProfileMismatches(uploaded, emptyFieldMap());
    return {
      verificationStatus: 'PENDING_REVIEW',
      verificationNumber: '',
      qrScanResult,
      trustedRecord: emptyFieldMap(),
      extractedData: extracted || emptyFieldMap(),
      declaredData: declared || emptyFieldMap(),
      uploadedData: uploaded,
      profileData: profileFromAccount,
      profileMismatchedFields,
      verificationScore: 0,
      mismatchedFields: [],
      reason:
        'The certificate does not contain a readable QR code or verification number. Manual verification is required.',
      isDuplicate: false,
      duplicateOfUser: null,
    };
  }

  // ── Look up the trusted record ──────────────────────────────────────────
  const record = await VerifiedCertificate.findOne({ verificationCode: normalizedNumber })
    .or([{ verificationCode: normalizedNumber }, { certificateNumber: normalizedNumber }])
    .lean();

  // ── Rule 3: unknown verification number ─────────────────────────────────
  if (!record) {
    const uploaded = buildUploadedData({ extracted, declared, account: applicant });
    const { profileMismatchedFields } = buildProfileMismatches(uploaded, emptyFieldMap());
    return {
      verificationStatus: 'INVALID',
      verificationNumber: normalizedNumber,
      qrScanResult,
      trustedRecord: emptyFieldMap(),
      extractedData: extracted || emptyFieldMap(),
      declaredData: declared || emptyFieldMap(),
      uploadedData: uploaded,
      profileData: profileFromAccount,
      profileMismatchedFields,
      verificationScore: 0,
      mismatchedFields: [],
      reason: 'Certificate verification number was not found in the trusted verification database.',
      isDuplicate: false,
      duplicateOfUser: null,
    };
  }

  // ── Rule 4: duplicate certificate (same number used by another account) ─
  const existingForNumber = await CertificateVerification.findOne({
    verificationNumber: normalizedNumber,
    user: { $ne: applicant._id },
    verificationStatus: { $in: ['VERIFIED', 'SUSPICIOUS', 'PENDING_REVIEW'] },
  })
    .select('user')
    .lean();

  const isDuplicate = Boolean(existingForNumber);
  const duplicateOfUser = existingForNumber ? existingForNumber.user : null;

  // ── Rule 1/2: field-by-field comparison ─────────────────────────────────
  const trusted = pickTrusted(record);
  const uploaded = buildUploadedData({ extracted, declared, account: applicant });

  const mismatchedFields = [];
  IMPORTANT_FIELDS.forEach(({ key, label }) => {
    const result = compareField(key, uploaded[key], trusted[key]);
    if (result === false) {
      mismatchedFields.push({ field: key, label, uploaded: uploaded[key], trusted: trusted[key] });
    }
  });

  // Identity check: the applicant's account name is also compared against the
  // trusted record. This catches someone reusing another person's *unmodified*
  // genuine certificate (the document text would otherwise match).
  const nameFromAccount = applicant
    ? [applicant.firstName, applicant.lastName].filter(Boolean).join(' ').trim()
    : '';
  const nameMismatchAlreadyFlagged = mismatchedFields.some((m) => m.field === 'fullName');
  if (
    !nameMismatchAlreadyFlagged &&
    nameFromAccount &&
    compareField('fullName', nameFromAccount, trusted.fullName) === false
  ) {
    mismatchedFields.push({
      field: 'fullName',
      label: 'Name',
      uploaded: nameFromAccount,
      trusted: trusted.fullName,
    });
  }

  // Any clear mismatch → SUSPICIOUS (Rule 2). Otherwise VERIFIED (Rule 1).
  // Fields that could not be extracted do not cause a mismatch; they only
  // matter when the verification number is missing entirely (Rule 5).
  let verificationStatus = 'VERIFIED';
  let reason = 'All important certificate fields match the trusted institution record.';

  if (mismatchedFields.length > 0) {
    verificationStatus = 'SUSPICIOUS';
    const labels = mismatchedFields.map((m) => m.label);
    reason = `One or more important certificate fields do not match the trusted record: ${labels.join(', ')}.`;
  }

  // ── CV/Profile consistency check (document vs registered account) ───────
  const profileMismatchedFields = [];
  const profileMismatchedKeys = new Set();
  PROFILE_FIELDS.forEach(({ key, label }) => {
    const result = compareProfileField(key, profileFromDocument[key], profileFromAccount[key]);
    if (result === false) {
      profileMismatchedFields.push({
        field: key,
        label,
        uploaded: profileFromDocument[key],
        registered: profileFromAccount[key],
      });
      profileMismatchedKeys.add(key);
    }
  });

  if (profileMismatchedFields.length > 0) {
    verificationStatus = 'SUSPICIOUS';
    const labels = profileMismatchedFields.map((m) => m.label);
    reason = `Profile information extracted from the document does not match the registered account (${labels.join(', ')}).`;
  }

  // ── Informational verification score ────────────────────────────────────
  const mismatchedKeys = new Set(mismatchedFields.map((m) => m.field));
  const verificationScore = computeScore({
    uploaded,
    trusted,
    profileFromAccount,
    profileFromDocument,
    mismatchedKeys,
    profileMismatchedKeys,
  });

  return {
    verificationStatus,
    verificationNumber: normalizedNumber,
    certificateId: record._id,
    qrScanResult,
    trustedRecord: trusted,
    extractedData: extracted || emptyFieldMap(),
    declaredData: declared || emptyFieldMap(),
    uploadedData: uploaded,
    profileData: profileFromAccount,
    profileMismatchedFields,
    verificationScore,
    mismatchedFields,
    reason,
    isDuplicate,
    duplicateOfUser,
  };
};

module.exports = {
  runVerification,
  IMPORTANT_FIELDS,
  PROFILE_FIELDS,
  compareField,
  compareProfileField,
  buildUploadedData,
  buildProfileData,
  buildDocumentProfile,
  pickTrusted,
  normalizeField,
  computeScore,
};