const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, getUnreadCount, updateMessage, deleteMessage } = require('../controllers/messageController');
const { protect, requireEmailVerified } = require('../middleware/auth');

router.use(protect, requireEmailVerified);
router.get('/', getConversations);
router.get('/unread/count', getUnreadCount);
router.get('/:id/messages', getMessages);
router.post('/', sendMessage);
router.patch('/:id', updateMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
