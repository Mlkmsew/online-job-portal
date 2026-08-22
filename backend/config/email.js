// ============================================
// Email Configuration - Brevo HTTPS API (primary) / Nodemailer SMTP (local dev only)
// ============================================
const nodemailer = require('nodemailer');
const { resolveClientURL } = require('../utils/getLocalIP');
const { OTP_EXPIRE_MINUTES } = require('./otpPolicy');

// Expiry phrase shared by every OTP email so copy can never drift from the
// actual backend expiration defined in config/otpPolicy.js
const otpExpiryPhrase = `${OTP_EXPIRE_MINUTES} minute${OTP_EXPIRE_MINUTES !== 1 ? 's' : ''}`;

// Mask an email address for safe logging: "me***@gmail.com"
const maskEmail = (value) => {
  if (!value || typeof value !== 'string') return '(not set)';
  const at = value.indexOf('@');
  if (at === -1) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, Math.min(2, at))}***@${value.slice(at + 1)}`;
};

// Strip/replace any email addresses that SMTP error messages may embed
const maskEmailsInText = (text) => {
  if (!text) return '';
  return String(text).replace(/[\w.+-]+@[\w.-]+\.\w+/g, (match) => maskEmail(match));
};

// ============================================
// Transport selection
// - EMAIL_PROVIDER=https -> Brevo HTTPS API (port 443). Required on Render
//   free tier because outbound SMTP ports (25/465/587) are blocked there.
// - EMAIL_PROVIDER=smtp  -> classic Nodemailer SMTP (local development).
// ============================================
const emailProvider = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase() === 'https'
  ? 'https'
  : 'smtp';

// Read environment variables (names must match .env.example exactly)
const emailHost = process.env.EMAIL_HOST?.trim();
const emailPortRaw = parseInt(process.env.EMAIL_PORT, 10);
const emailPort = Number.isFinite(emailPortRaw) ? emailPortRaw : 587;
const emailSecure = process.env.EMAIL_SECURE === 'true';
const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

// Parse EMAIL_FROM which may be:
//   "OnlineJob Portal <me@gmail.com>"  |  "OnlineJob Portal me@gmail.com"  |  "me@gmail.com"
const parseFromAddress = (raw) => {
  const value = (raw || '').trim();
  const bracket = value.match(/^(.*?)<\s*([^>]+@[^>]+)\s*>$/);
  if (bracket) return { name: bracket[1].trim().replace(/^["']|["']$/g, ''), email: bracket[2].trim() };
  const token = value.split(/\s+/).find((part) => part.includes('@'));
  if (!token) return null;
  const name = value.replace(token, '').trim().replace(/^["']|["']$/g, '');
  return { name: name || 'OnlineJob Portal', email: token };
};
const fromAddress = parseFromAddress(process.env.EMAIL_FROM) || { name: 'OnlineJob Portal', email: emailUser };

const missingEmailVars =
  emailProvider === 'https'
    ? [
        !brevoApiKey && 'BREVO_API_KEY',
        !fromAddress?.email && 'EMAIL_FROM (must contain a valid sender email)',
      ].filter(Boolean)
    : [
        !emailHost && 'EMAIL_HOST',
        !emailUser && 'EMAIL_USER',
        !emailPass && 'EMAIL_PASS',
      ].filter(Boolean);

if (missingEmailVars.length > 0) {
  console.error(
    `❌ Email configuration incomplete — missing: ${missingEmailVars.join(', ')}. ` +
    'OTP emails will fail until these are set in the deployment environment.'
  );
}
// Safe startup summary (never logs secrets)
const providerSummary =
  emailProvider === 'https'
    ? `provider=brevo(HTTPS/443), from=${maskEmail(fromAddress.email)}, apiKey=${brevoApiKey ? 'set' : 'MISSING'}`
    : `provider=smtp, host=${emailHost || '(not set)'}, port=${emailPort}, secure=${emailSecure}, ` +
      `user=${maskEmail(emailUser)}, pass=${emailPass ? 'set' : 'MISSING'}`;
console.log(`📧 Email config: ${providerSummary}, from=${process.env.EMAIL_FROM ? 'set' : 'default'}`);

// Create reusable transporter only for the SMTP fallback path.
// In https mode no TCP/SMTP connection is ever created or verified.
const transporter =
  emailProvider === 'smtp'
    ? nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailSecure,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          // Allow self-signed certs for some SMTP providers in dev environments
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      })
    : null;

// Verify transporter connectivity on startup (SMTP mode only; helps debug issues in logs)
if (transporter) {
  transporter.verify()
    .then(() => {
      console.log(`✅ SMTP transporter ready (host=${emailHost || '(not set)'}:${emailPort}, secure=${emailSecure})`);
    })
    .catch((err) => {
      console.error('❌ SMTP transporter verification failed:');
      console.error(`   name=${err?.name || 'Error'} code=${err?.code || 'n/a'} command=${err?.command || 'n/a'}`);
      console.error(`   message=${maskEmailsInText(err?.message || String(err))}`);
      if (err?.response) console.error(`   smtpResponse=${maskEmailsInText(err.response)}`);
    });
} else {
  console.log('✅ Brevo HTTPS transport configured (api.brevo.com:443) — no SMTP connection will be attempted');
}

/**
 * Send an email through the Brevo HTTPS API (port 443).
 * @param {Object} options - { to, subject, html?, text? }
 * @returns {Promise<{messageId: string, accepted: string[], rejected: string[]}>}
 */
const sendEmailViaBrevo = async (options) => {
  if (!brevoApiKey) {
    throw Object.assign(new Error('Brevo API key is not configured'), { code: 'BREVO_NO_KEY' });
  }

  const payload = {
    sender: { name: fromAddress.name || 'OnlineJob Portal', email: fromAddress.email },
    to: [{ email: options.to }],
    subject: options.subject,
  };
  if (options.html) payload.htmlContent = options.html;
  if (options.text) payload.textContent = options.text;
  if (options.replyTo) payload.replyTo = { email: options.replyTo };

  // Hard timeout so a slow API can never stall a registration request
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let resp;
  try {
    resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw Object.assign(new Error('Brevo API request timed out after 15000ms'), { code: 'BREVO_TIMEOUT' });
    }
    throw Object.assign(
      new Error(maskEmailsInText(err?.message || 'Network error while calling Brevo API')),
      { code: err?.code || 'BREVO_NETWORK_ERROR' }
    );
  }
  clearTimeout(timer);

  const rawBody = await resp.text();
  if (!resp.ok) {
    let detail = '';
    try {
      const parsed = JSON.parse(rawBody);
      detail = parsed?.message || parsed?.detail || '';
    } catch (_) {
      detail = rawBody.slice(0, 300);
    }
    throw Object.assign(
      new Error(`Brevo API error status=${resp.status} message=${maskEmailsInText(detail) || '(no detail)'}`),
      { code: `BREVO_HTTP_${resp.status}` }
    );
  }

  let data = {};
  try {
    data = JSON.parse(rawBody);
  } catch (_) {
    data = {};
  }
  return {
    messageId: data.messageId || 'n/a',
    accepted: [options.to],
    rejected: [],
  };
};

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
    replyTo: options.replyTo,
  };

  console.log(
    `📧 Email send started: to=${maskEmail(mailOptions.to)} via ` +
    (emailProvider === 'https' ? 'api.brevo.com:443(HTTPS)' : `${emailHost || '(not set)'}:${emailPort}`) +
    ` subject="${mailOptions.subject}"`
  );

  if (emailProvider === 'https') {
    try {
      const info = await sendEmailViaBrevo(mailOptions);
      console.log(
        `📧 Email sent: messageId=${info.messageId || 'n/a'} accepted=${info.accepted?.length || 0} ` +
        `rejected=${info.rejected?.length || 0} response="brevo https accepted"`
      );
      return info;
    } catch (error) {
      console.error('❌ Email sending failed:');
      console.error(`   name=${error?.name || 'Error'} code=${error?.code || 'n/a'}`);
      console.error(`   message=${maskEmailsInText(error?.message || String(error))}`);
      throw error;
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `📧 Email sent: messageId=${info.messageId || 'n/a'} accepted=${info.accepted?.length || 0} ` +
      `rejected=${info.rejected?.length || 0} response="${info.response || ''}"`
    );
    if (info.rejected && info.rejected.length > 0) {
      console.error('⚠️ Some recipients were rejected by the SMTP server');
    }
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error(`   name=${error?.name || 'Error'} code=${error?.code || 'n/a'} command=${error?.command || 'n/a'}`);
    console.error(`   message=${maskEmailsInText(error?.message || String(error))}`);
    if (error?.response) console.error(`   smtpResponse=${maskEmailsInText(error.response)}`);
    throw error;
  }
};

/**
 * Get the resolved CLIENT_URL
 * Automatically detects local network IP if localhost is configured
 * This ensures password reset and verification links work on mobile devices
 * @returns {string} The resolved client URL with proper IP address
 */
const getClientURL = () => {
  return resolveClientURL(process.env.CLIENT_URL);
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
    text: `Hello ${name},\n\nYour verification code is: ${code}. It expires in ${otpExpiryPhrase}.\n\nIf you did not request this, please ignore this email.\n\n— OnlineJob Portal`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,Helvetica,sans-serif;background:#F8FAFC;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;">
          <h2 style="color:#0F766E">Hello, ${name} 👋</h2>
          <p>Your verification code is:</p>
          <p style="font-size:22px;font-weight:bold;letter-spacing:4px">${code}</p>
          <p style="color:#64748B">This code expires in <strong>${otpExpiryPhrase}</strong>. If you didn't create an account, please ignore this email.</p>
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
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}" style="word-break: break-all; color: #0f766e;">${resetUrl}</a></p>
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

  newMessageAlert: (recipientName, senderName, preview, conversationLink) => ({
    subject: `New message from ${senderName} - OnlineJob Portal`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0F766E, #14B8A6); padding: 40px 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; }
          .body { padding: 40px 30px; color: #334155; }
          .body h2 { margin-top: 0; }
          .preview { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0; color: #1F2937; }
          .button { display: inline-block; padding: 14px 28px; background: #0F766E; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; }
          .footer { background: #F1F5F9; padding: 20px 30px; text-align: center; color: #64748B; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 New Message Received</h1>
          </div>
          <div class="body">
            <h2>Hello ${recipientName},</h2>
            <p>You have received a new message from <strong>${senderName}</strong>.</p>
            <div class="preview">
              <p style="margin: 0 0 8px; color: #475569;"><strong>Message preview</strong></p>
              <p style="margin: 0; color: #0F172A;">${preview}</p>
            </div>
            <p>Click the button below to view the conversation and reply instantly.</p>
            <a href="${conversationLink}" class="button">View Conversation</a>
          </div>
          <div class="footer">
            <p>If you do not want to receive these notifications, you can update your notification preferences in your profile.</p>
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

module.exports = { sendEmail, emailTemplates, getClientURL };

