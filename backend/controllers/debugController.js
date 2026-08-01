const { sendEmail, emailTemplates, getClientURL } = require('../config/email');

// POST /api/debug/send-test-email
exports.sendTestEmail = async (req, res) => {
  const to = req.body.to || process.env.EMAIL_USER;
  const mode = req.body.mode || 'verify'; // 'verify' or 'text'

  try {
    if (mode === 'verify') {
      // Use centralized getClientURL to ensure proper IP resolution for mobile devices
      const verifyUrl = `${getClientURL()}/verify-email/TEST_TOKEN_${Date.now()}`;
      const template = emailTemplates.verifyEmail('Dev User', verifyUrl);
      const info = await sendEmail({ to, ...template });
      return res.status(200).json({ success: true, message: 'Test verification email sent.', info });
    }

    const info = await sendEmail({ to, subject: 'Test email from EthioJob', text: 'This is a test email from EthioJob backend.' });
    return res.status(200).json({ success: true, message: 'Test email sent.', info });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send test email.', error: err.message || err });
  }
};
