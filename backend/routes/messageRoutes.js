const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  updateMessage,
  deleteMessage,
  searchRecipients,
  uploadAttachment,
  markConversationRead,
  markConversationUnread,
  toggleArchiveConversation,
} = require('../controllers/messageController');
const { protect, requireEmailVerified } = require('../middleware/auth');
const { uploadChat } = require('../config/cloudinary');

router.use(protect, requireEmailVerified);
router.get('/', getConversations);
router.get('/unread/count', getUnreadCount);
router.get('/recipients', searchRecipients);
router.post('/upload', uploadChat.single('file'), uploadAttachment);
router.get('/:id/messages', getMessages);
router.post('/', sendMessage);
router.patch('/conversations/:id/read', markConversationRead);
router.patch('/conversations/:id/unread', markConversationUnread);
router.patch('/conversations/:id/archive', toggleArchiveConversation);
router.patch('/:id', updateMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
