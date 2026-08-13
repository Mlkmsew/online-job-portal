// ============================================
// VerifiedCertificate Model
// Trusted Certificate Verification Database
// This is the single source of truth used to verify
// certificates uploaded by job seekers. It represents
// the official records held by issuing institutions.
// ============================================
const mongoose = require('mongoose');

const verifiedCertificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, trim: true },
    certificateNumber: { type: String, required: [true, 'Certificate number is required'], unique: true, trim: true, uppercase: true, index: true },
    verificationCode: { type: String, trim: true, uppercase: true, index: true },
    studentId: { type: String, trim: true, uppercase: true },
    fullName: { type: String, required: [true, 'Full name is required'], trim: true },
    institution: { type: String, trim: true },
    program: { type: String, trim: true },
    certificateType: { type: String, trim: true },
    issueDate: { type: Date },
    graduationYear: { type: String, trim: true },
    // Status of the record in the trusted database
    status: { type: String, enum: ['VALID', 'REVOKED', 'INACTIVE'], default: 'VALID' },
    // Clearly separate university-demo (mock) data from production data
    dataSource: { type: String, enum: ['mock', 'production'], default: 'mock' },
    issuedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

// QR codes may embed the certificate number directly; keep both fields in sync
verifiedCertificateSchema.pre('save', function (next) {
  if (!this.verificationCode && this.certificateNumber) {
    this.verificationCode = this.certificateNumber;
  }
  next();
});

const VerifiedCertificate = mongoose.models.VerifiedCertificate || mongoose.model('VerifiedCertificate', verifiedCertificateSchema);
module.exports = VerifiedCertificate;