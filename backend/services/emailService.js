const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  secure: Boolean(process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true'),
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

const sendContactEmail = async ({ name, email, message }) => {
  if (!process.env.SMTP_HOST && !process.env.EMAIL_HOST) {
    throw new Error('Email service is not configured.');
  }

  if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
    throw new Error('Email service is not configured.');
  }

  if (!process.env.SMTP_PASS && !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured.');
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