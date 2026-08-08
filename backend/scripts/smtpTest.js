const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const env = process.env;

console.log('Running SMTP connectivity check using backend/.env');

const checkField = (key) => {
  const v = env[key];
  if (!v) return `${key}: MISSING`;
  if (key === 'EMAIL_PASS') return `${key}: set (${v.length} chars)`;
  return `${key}: set`;
};

console.log(checkField('EMAIL_HOST'));
console.log(checkField('EMAIL_PORT'));
console.log(checkField('EMAIL_SECURE'));
console.log(checkField('EMAIL_USER'));
console.log(checkField('EMAIL_FROM'));
console.log(checkField('EMAIL_PASS'));

const rawPass = env.EMAIL_PASS || '';
const pass = rawPass.replace(/\s+/g, '');
const hasLeadingOrTrailing = rawPass.length > 0 && (rawPass !== rawPass.trim());
const hasInnerSpaces = rawPass.includes(' ');

console.log('EMAIL_PASS has leading/trailing spaces:', hasLeadingOrTrailing);
console.log('EMAIL_PASS contains space characters:', hasInnerSpaces);
if (rawPass !== pass) {
  console.log('INFO: EMAIL_PASS whitespace removed before SMTP auth.');
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT, 10) || 587,
  secure: env.EMAIL_SECURE === 'true',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: env.NODE_ENV === 'production',
  },
});

console.log('Verifying transporter...');
transporter.verify((err, success) => {
  if (err) {
    console.error('transporter.verify() failed:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
  console.log('transporter.verify() succeeded. SMTP server accepted connection.');
  process.exit(0);
});
