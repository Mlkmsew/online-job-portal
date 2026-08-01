const { Conversation, Message } = require('../models/Message');
const User = require('../models/user');
const { asyncHandler, createNotification } = require('../utils/helpers');
const { sendEmail, emailTemplates, getClientURL } = require('../config/email');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get the current user's conversations
// @route   GET /api/messages
// @access  Private
exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .populate('participants', 'firstName lastName avatar role')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName avatar' } })
    .sort({ lastMessageAt: -1 });

  res.status(200).json({ success: true, count: conversations.length, data: conversations });
});

// @desc    Get messages for a conversation
// @route   GET /api/messages/:id/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new AppError('Conversation not found.', 404));

  if (!conversation.participants.includes(req.user.id)) {
    return next(new AppError('Not authorized to view this conversation.', 403));
  }

  const messages = await Message.find({ conversation: req.params.id })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName avatar');

  if (conversation.unreadCount?.get(req.user.id.toString()) > 0) {
    conversation.unreadCount.set(req.user.id.toString(), 0);
    await conversation.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, count: messages.length, data: messages });
});

// @desc    Send a message in a conversation
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  let { conversationId, recipientId, content, type = 'text', fileUrl, fileName } = req.body;

  if (!recipientId && !conversationId) {
    return next(new AppError('Recipient ID or conversation ID is required.', 400));
  }

  if (!content && !fileUrl) {
    return next(new AppError('Message content or file is required.', 400));
  }

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (conversation && !recipientId) {
      recipientId = conversation.participants.find((participant) => participant.toString() !== req.user.id.toString());
    }
  } else {
    conversation = await Conversation.findOne({ participants: { $all: [req.user.id, recipientId] } });
  }

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, recipientId],
      lastMessageAt: new Date(),
      unreadCount: { [recipientId]: 0, [req.user.id]: 0 },
    });
  }

  if (!recipientId) {
    return next(new AppError('Recipient not found for this conversation.', 400));
  }

  const recipient = await User.findOne({
    $or: [{ _id: recipientId }, { email: recipientId }],
  }).select('firstName email isActive isSuspended');
  if (!recipient) {
    return next(new AppError('Recipient user not found.', 404));
  }

  const recipientObjectId = recipient._id.toString();
  if (recipientId !== recipientObjectId) {
    recipientId = recipientObjectId;
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user.id,
    receiver: recipientId,
    content,
    type,
    fileUrl,
    fileName,
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  const currentUnread = conversation.unreadCount?.get(recipientId.toString()) || 0;
  conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
  await conversation.save({ validateBeforeSave: false });

  await createNotification({
    recipient: recipientId,
    type: 'new_message',
    title: 'New Message',
    message: `${req.user.firstName} sent you a message.`,
    link: '/messages',
    data: { conversationId: conversation._id, messageId: message._id },
  });

  const ioSendMessage = require('../config/socket').sendMessageToChat;
  const socketPayload = {
    _id: message._id,
    conversation: conversation._id,
    sender: req.user.id,
    receiver: recipientId,
    content,
    type,
    fileUrl,
    fileName,
    createdAt: message.createdAt || new Date(),
    updatedAt: message.updatedAt || new Date(),
  };
  ioSendMessage(conversation._id.toString(), socketPayload);

  if (recipient.email && recipient.isActive && !recipient.isSuspended) {
    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    const preview = type === 'text' ? `${content}`.slice(0, 120) : `Sent a ${type} message.`;
    const conversationLink = `${getClientURL()}/messages?conversationId=${conversation._id}`;
    const emailTemplate = emailTemplates.newMessageAlert(recipient.firstName || 'Friend', senderName, preview || 'You have a new message.', conversationLink);

    try {
      await sendEmail({ to: recipient.email, ...emailTemplate });
    } catch (emailError) {
      console.error('Failed to send message notification email:', emailError && emailError.message ? emailError.message : emailError);
    }
  }

  res.status(201).json({ success: true, message: 'Message sent.', data: { conversation, message } });
});
