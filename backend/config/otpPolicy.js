// ============================================
// OTP lifetime policy — single source of truth.
// The User model (actual expiration) and the email templates (copy) both
// read this value so the stated expiry can never drift from the real one.
// ============================================
const OTP_EXPIRE_MINUTES = Math.max(1, parseInt(process.env.OTP_EXPIRE_MINUTES || '1', 10));

module.exports = { OTP_EXPIRE_MINUTES };
