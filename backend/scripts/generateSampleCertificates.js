// ============================================
// Generate sample certificate files for testing
// Creates real PDF/PNG files containing an embedded
// QR code (verification number) + a text layer, so the
// full verification workflow can be exercised end to end.
//
// Run: node backend/scripts/generateSampleCertificates.js
// ============================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'sample-certificates');

// Mock records matching the seeded trusted database
const SAMPLES = [
  {
    fileName: 'DBU-CERT-2026-00125-solomon.pdf',
    type: 'pdf',
    number: 'DBU-CERT-2026-00125',
    fullName: 'Solomon Tadesse',
    studentId: 'DBU-IS-12345',
    institution: 'Debre Birhan University',
    program: 'Information Systems',
    certificateType: 'Degree Certificate',
    issueDate: '2026-07-20',
    graduationYear: '2026',
  },
  {
    fileName: 'DBU-CERT-2026-00125-solomon.png',
    type: 'png',
    number: 'DBU-CERT-2026-00125',
  },
  {
    // Fraud Scenario 2: a genuine certificate whose name was modified.
    // Same certificate number / student ID, but the name has been changed.
    fileName: 'DBU-CERT-2026-00125-ahmed-MODIFIED.pdf',
    type: 'pdf',
    number: 'DBU-CERT-2026-00125',
    fullName: 'Ahmed Ali',
    studentId: 'DBU-IS-12345',
    institution: 'Debre Birhan University',
    program: 'Information Systems',
    certificateType: 'Degree Certificate',
    issueDate: '2026-07-20',
    graduationYear: '2026',
  },
  {
    fileName: 'DBU-CERT-2026-00250-hanna.pdf',
    type: 'pdf',
    number: 'DBU-CERT-2026-00250',
    fullName: 'Hanna Getachew',
    studentId: 'DBU-IS-23456',
    institution: 'Debre Birhan University',
    program: 'Business Administration',
    certificateType: 'Degree Certificate',
    issueDate: '2025-06-30',
    graduationYear: '2025',
  },
  {
    fileName: 'DBU-CERT-9999-99999-unknown.pdf',
    type: 'pdf',
    number: 'DBU-CERT-9999-99999',
    fullName: 'Sara Mohammed',
    studentId: 'DBU-IS-00000',
    institution: 'Debre Birhan University',
    program: 'Unknown Program',
    certificateType: 'Degree Certificate',
    issueDate: '2026-01-01',
    graduationYear: '2026',
  },
  {
    fileName: 'no-qr-certificate.pdf',
    type: 'pdf',
    number: '',
    fullName: 'Dawit Alemu',
    studentId: 'DBU-IS-77777',
    institution: 'Debre Birhan University',
    program: 'Information Technology',
    certificateType: 'Degree Certificate',
    issueDate: '2025-03-15',
    graduationYear: '2025',
  },
];

const buildPdf = async (sample) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#163A5F').text('DEBRE BIRHAN UNIVERSITY', { align: 'center' });
  doc.font('Helvetica').fontSize(12).fillColor('#444444').text('Office of the Registrar', { align: 'center' });
  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#111111').text('CERTIFICATE OF COMPLETION', { align: 'center' });
  doc.moveDown(1.2);

  doc.font('Helvetica-Bold').fontSize(11).text(`Certificate Number: ${sample.number || 'N/A'}`);
  doc.moveDown(1);

  doc.font('Helvetica').fontSize(12).text('This is to certify that');
  doc.font('Helvetica-Bold').fontSize(16).text(sample.fullName);
  doc.font('Helvetica').fontSize(12).text(`Student ID: ${sample.studentId}`);
  doc.moveDown(0.5);
  doc.text('has successfully completed the requirements of the');
  doc.font('Helvetica-Bold').fontSize(13).text(`${sample.program} program`);
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12).text(`Institution: ${sample.institution}`);
  doc.text(`Certificate Type: ${sample.certificateType}`);
  doc.text(`Issue Date: ${sample.issueDate}`);
  doc.text(`Graduation Year: ${sample.graduationYear}`);
  doc.moveDown(1.5);

  if (sample.number) {
    const qr = await QRCode.toBuffer(sample.number, { type: 'png', width: 256, margin: 2 });
    doc.image(qr, { width: 100, align: 'right' });
  }
  doc.moveDown(1);
  doc.font('Helvetica').fontSize(10).fillColor('#666666').text(
    sample.number
      ? 'Verification: scan the QR code or verify the certificate number on the job portal.'
      : 'This document contains no verification number or QR code.'
  );

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

const buildPng = async (sample) => {
  return QRCode.toBuffer(sample.number, { type: 'png', width: 512, margin: 2 });
};

const main = async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const sample of SAMPLES) {
    const outPath = path.join(OUT_DIR, sample.fileName);
    const bytes = sample.type === 'pdf' ? await buildPdf(sample) : await buildPng(sample);
    fs.writeFileSync(outPath, bytes);
    console.log(`  ✅ ${sample.fileName}`);
  }
  console.log(`\nSample certificates written to: ${OUT_DIR}`);
};

main().catch((err) => {
  console.error('Sample generation error:', err);
  process.exit(1);
});