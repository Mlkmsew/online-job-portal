const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../controllers/debugController');

router.post('/send-test-email', sendTestEmail);

module.exports = router;
