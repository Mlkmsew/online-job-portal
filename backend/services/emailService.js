const nodemailer = require('nodemailer');

const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || '').trim();
const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true';
const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();

if (!smtpHost || !smtpUser || !smtpPass) {
  console.error('❌ Email service configuration is incomplete. Set SMTP_HOST/EMAIL_HOST, SMTP_USER/EMAIL_USER, and SMTP_PASS/EMAIL_PASS.');
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const sendContactEmail = async ({ name, email, message }) => {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Email service is not configured. Please review your SMTP environment variables.');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
    to: process.env.CONTACT_ADMIN_EMAIL || 'melkamsewalehegn@gmail.com',
    replyTo: email,
    subject: `New Contact Form Message from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="color: #0f766e;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendContactEmail };