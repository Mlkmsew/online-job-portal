const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/emailService');

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide your name, email, and message.' });
    }

    await sendContactEmail({ name, email, message });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('Contact form email error:', error);
    res.status(500).json({
      success: false,
      message: 'We could not send your message right now. Please try again later.',
    });
  }
});

module.exports = router;