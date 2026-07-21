const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');
const { protect, requireEmailVerified } = require('../middleware/auth');

router.use(protect, requireEmailVerified);
router.get('/', getConversations);
router.get('/:id/messages', getMessages);
router.post('/', sendMessage);

module.exports = router;
