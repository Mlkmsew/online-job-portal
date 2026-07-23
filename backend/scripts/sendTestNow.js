const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const env = process.env;

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT, 10) || 587,
  secure: env.EMAIL_SECURE === 'true',
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
  tls: { rejectUnauthorized: env.NODE_ENV === 'production' },
});

const to = process.argv[2] || env.EMAIL_USER;

const mailOptions = {
  from: env.EMAIL_FROM || env.EMAIL_USER,
  to,
  subject: 'EthioJob - SMTP test email',
  text: `This is a test email sent at ${new Date().toISOString()}`,
};

console.log('Sending test email to', to);
transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('sendMail error:', err && err.message ? err.message : err);
    process.exit(1);
  }
  console.log('Email sent:', info.messageId);
  if (info.accepted && info.accepted.length) console.log('Accepted:', info.accepted);
  if (info.rejected && info.rejected.length) console.log('Rejected:', info.rejected);
  if (info.response) console.log('SMTP response:', info.response);
  process.exit(0);
});
