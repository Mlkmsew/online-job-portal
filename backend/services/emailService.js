const { sendEmail } = require('../config/email');

// Recipient used when CONTACT_ADMIN_EMAIL is not configured
const CONTACT_FALLBACK_EMAIL = 'melkamsewalehegn@gmail.com';

const buildContactHtml = ({ name, email, message }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <h2 style="color: #0f766e;">New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br />')}</p>
  </div>
`;

const sendContactEmail = async ({ name, email, message }) => {
  await sendEmail({
    to: process.env.CONTACT_ADMIN_EMAIL || CONTACT_FALLBACK_EMAIL,
    replyTo: email,
    subject: `New Contact Form Message from ${name}`,
    html: buildContactHtml({ name, email, message }),
  });
};

module.exports = { sendContactEmail };
