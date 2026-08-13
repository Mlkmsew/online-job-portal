// ============================================
// CertificateVerification Model
// Verification log / history. Every verification
// attempt performed by the system is recorded here
// so administrators can review past attempts.
// ============================================
const mongoose = require('mongoose');

const certificateVerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Trusted record this attempt was checked against (if found)
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'VerifiedCertificate', index: true },

    // Uploaded document metadata (never trust the client for this)
    uploadedDocument: {
      url: { type: String },
      publicId: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      fileSize: { type: Number },
    },

    // Verification number extracted from QR / document text / manual entry
    verificationNumber: { type: String, trim: true, uppercase: true, index: true },

    // QR scanning result
    qrScanResult: {
      status: { type: String, enum: ['detected', 'not_detected', 'unreadable'], default: 'not_detected' },
      raw: { type: String },
      message: { type: String },
    },

    // What the system could extract from the uploaded document
    extractedData: {
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      certificateNumber: { type: String, default: '' },
      institution: { type: String, default: '' },
      program: { type: String, default: '' },
      certificateType: { type: String, default: '' },
      issueDate: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    // Data declared by the applicant (or inferred from their account)
    declaredData: {
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      certificateNumber: { type: String, default: '' },
      institution: { type: String, default: '' },
      program: { type: String, default: '' },
      certificateType: { type: String, default: '' },
      issueDate: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    // Effective values used in the field-by-field comparison
    // (extracted document data merged with declared/account data)
    uploadedData: {
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      certificateNumber: { type: String, default: '' },
      institution: { type: String, default: '' },
      program: { type: String, default: '' },
      certificateType: { type: String, default: '' },
      issueDate: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    // Snapshot of the trusted record at verification time
    trustedRecord: {
      certificateNumber: { type: String, default: '' },
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      institution: { type: String, default: '' },
      program: { type: String, default: '' },
      certificateType: { type: String, default: '' },
      issueDate: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
    },

    // Registered account profile used for the CV-consistency check
    profileData: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    // Profile fields on the document that do NOT match the registered account
    profileMismatchedFields: [
      {
        field: { type: String },
        label: { type: String },
        uploaded: { type: mongoose.Schema.Types.Mixed },
        registered: { type: mongoose.Schema.Types.Mixed },
      },
    ],

    // Informational verification score (0-100), advisory only
    verificationScore: { type: Number, default: 0 },

    // System result
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'SUSPICIOUS', 'INVALID', 'PENDING_REVIEW'],
      default: 'PENDING_REVIEW',
      index: true,
    },
    mismatchedFields: [
      {
        field: { type: String },
        label: { type: String },
        uploaded: { type: mongoose.Schema.Types.Mixed },
        trusted: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    reason: { type: String, default: '' },

    // Duplicate detection
    isDuplicate: { type: Boolean, default: false },
    duplicateOfUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Admin review
    reviewStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'verified', 'rejected', 'marked_suspicious'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String, default: '' },
    verifiedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

certificateVerificationSchema.index({ user: 1, verificationNumber: 1 });

const CertificateVerification =
  mongoose.models.CertificateVerification || mongoose.model('CertificateVerification', certificateVerificationSchema);
module.exports = CertificateVerification;