// ============================================
// Email Configuration - Nodemailer
// ============================================
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Allow self-signed certs for some SMTP providers in dev environments
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

// Verify transporter connectivity on startup (helps debug SMTP issues)
transporter.verify()
  .then(() => console.log('✅ Nodemailer transporter is ready'))
  .catch((err) => console.error('❌ Nodemailer transporter verification failed:', err));

/**
 * Send email utility
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'OnlineJob Portal <noreply@ethiojob.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // Log detailed info to assist debugging delivery issues
    console.log(`📧 Email sent: ${info.messageId}`);
    if (info.accepted && info.accepted.length) console.log('Accepted:', info.accepted);
    if (info.rejected && info.rejected.length) console.log('Rejected:', info.rejected);
    if (info.response) console.log('SMTP response:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error && error.message ? error.message : error);
    // In development, print the full mail options so token/code can be retrieved
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('--- Mail options (DEV) ---');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        if (mailOptions.text) console.log('Text:', mailOptions.text);
        // Avoid printing large HTML by truncating
        if (mailOptions.html) console.log('HTML (truncated):', mailOptions.html.substring(0, 400));
        console.log('-------------------------');
      } catch (e) {
        // ignore
      }
    }
    throw error;
  }
};

// Email templates
const emailTemplates = {
  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify Your Email - OnlineJob Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0F766E, #14B8A6); padding: 40px 30px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; }
          .body { padding: 40px 30px; }
          .body h2 { color: #1E293B; font-size: 22px; }
          .body p { color: #64748B; line-height: 1.6; }
          .btn { display: inline-block; background: linear-gradient(135deg, #0F766E, #14B8A6); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { background: #F1F5F9; padding: 20px 30px; text-align: center; color: #94A3B8; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 OnlineJob Portal</h1>
            <p>Connecting Ethiopian Youth with Employment Opportunities</p>
          </div>
          <div class="body">
            <h2>Hello, ${name}! 👋</h2>
            <p>Welcome to OnlineJob Portal! We're excited to have you on board. Please verify your email address to activate your account and start exploring thousands of job opportunities.</p>
            <a href="${verifyUrl}" class="btn">✅ Verify Email Address</a>
            <p>This link expires in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 OnlineJob Portal. All rights reserved.</p>
            <p>Addis Ababa, Ethiopia</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  verifyOTP: (name, code) => ({
    subject: 'Your verification code - OnlineJob Portal',
    text: `Hello ${name},\n\nYour verification code is: ${code}. It expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n— OnlineJob Portal`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,Helvetica,sans-serif;background:#F8FAFC;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;">
          <h2 style="color:#0F766E">Hello, ${name} 👋</h2>
          <p>Your verification code is:</p>
          <p style="font-size:22px;font-weight:bold;letter-spacing:4px">${code}</p>
          <p style="color:#64748B">This code expires in <strong>10 minutes</strong>. If you didn't create an account, please ignore this email.</p>
          <hr style="margin-top:20px;border:none;border-top:1px solid #EEF2F7" />
          <p style="font-size:12px;color:#94A3B8">© OnlineJob Portal</p>
        </div>
      </body>
      </html>
    `,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Reset Your Password - OnlineJob Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0F766E, #14B8A6); padding: 40px 30px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 28px; }
          .body { padding: 40px 30px; }
          .body h2 { color: #1E293B; font-size: 22px; }
          .body p { color: #64748B; line-height: 1.6; }
          .btn { display: inline-block; background: #EF4444; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { background: #F1F5F9; padding: 20px 30px; text-align: center; color: #94A3B8; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="body">
            <h2>Hello, ${name}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
            <p>This link expires in <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2024 OnlineJob Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  applicationReceived: (name, jobTitle, companyName) => ({
    subject: `Application Received - ${jobTitle} at ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #F8FAFC; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0F766E, #14B8A6); padding: 30px; text-align: center; color: white; }
          .body { padding: 30px; color: #64748B; line-height: 1.6; }
          .highlight { background: #F0FDF4; border-left: 4px solid #22C55E; padding: 16px; border-radius: 4px; margin: 16px 0; }
          .footer { background: #F1F5F9; padding: 20px; text-align: center; color: #94A3B8; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>✅ Application Submitted!</h1></div>
          <div class="body">
            <h2 style="color:#1E293B">Hi ${name},</h2>
            <p>Your application has been successfully submitted!</p>
            <div class="highlight">
              <strong>Position:</strong> ${jobTitle}<br>
              <strong>Company:</strong> ${companyName}
            </div>
            <p>The employer will review your application and get back to you. You can track your application status from your dashboard.</p>
          </div>
          <div class="footer"><p>© 2024 OnlineJob Portal</p></div>
        </div>
      </body>
      </html>
    `,
  }),

  interviewInvitation: (name, jobTitle, companyName, date, location) => ({
    subject: `Interview Invitation - ${jobTitle} at ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #F8FAFC; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #F59E0B, #D97706); padding: 30px; text-align: center; color: white; }
          .body { padding: 30px; color: #64748B; line-height: 1.6; }
          .detail { background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 4px; margin: 16px 0; }
          .footer { background: #F1F5F9; padding: 20px; text-align: center; color: #94A3B8; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🎉 Interview Invitation!</h1></div>
          <div class="body">
            <h2 style="color:#1E293B">Congratulations, ${name}!</h2>
            <p>You've been invited for an interview. Here are the details:</p>
            <div class="detail">
              <strong>Position:</strong> ${jobTitle}<br>
              <strong>Company:</strong> ${companyName}<br>
              <strong>Date & Time:</strong> ${date}<br>
              <strong>Location:</strong> ${location}
            </div>
            <p>Please confirm your attendance by logging into your dashboard.</p>
          </div>
          <div class="footer"><p>© 2024 OnlineJob Portal</p></div>
        </div>
      </body>
      </html>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };

