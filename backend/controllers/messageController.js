const mongoose = require('mongoose');
const { Conversation, Message } = require('../models/Message');
const User = require('../models/user');
const { asyncHandler, createNotification } = require('../utils/helpers');
const { sendEmail, emailTemplates, getClientURL } = require('../config/email');
const { sendUpdatedMessageToChat, sendDeletedMessageToChat } = require('../config/socket');
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

  const unreadUpdate = await Message.updateMany(
    { conversation: req.params.id, receiver: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  if (unreadUpdate.modifiedCount > 0 && conversation.unreadCount?.get(req.user.id.toString()) > 0) {
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
  let recipientEmail;

  if (recipientId) {
    const trimmedRecipient = recipientId.toString().trim();
    if (trimmedRecipient.includes('@')) {
      recipientEmail = trimmedRecipient.toLowerCase();
      const recipientUser = await User.findOne({ email: recipientEmail }).select('_id firstName email isActive isSuspended');
      if (!recipientUser) {
        return next(new AppError('No user found with this email.', 404));
      }
      recipientId = recipientUser._id.toString();
    } else {
      recipientId = trimmedRecipient;
    }
  }

  if (conversationId && !mongoose.Types.ObjectId.isValid(conversationId)) {
    conversationId = undefined;
  }

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (conversation && !recipientId) {
      recipientId = conversation.participants.find((participant) => participant.toString() !== req.user.id.toString());
    }
  }

  if (!recipientId) {
    return next(new AppError('Recipient ID or conversation ID is required.', 400));
  }

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    return next(new AppError('Invalid recipient identifier provided.', 400));
  }

  conversation = await Conversation.findOne({ participants: { $all: [req.user.id, recipientId] } });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, recipientId],
      lastMessageAt: new Date(),
      unreadCount: { [recipientId]: 0, [req.user.id]: 0 },
    });
  }

  const recipient = await User.findById(recipientId).select('firstName email isActive isSuspended');
  if (!recipient) {
    return next(new AppError('No user found with this email.', 404));
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user.id,
    receiver: recipient._id,
    content,
    type,
    fileUrl,
    fileName,
    isRead: false,
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  const currentUnread = conversation.unreadCount?.get(recipient._id.toString()) || 0;
  conversation.unreadCount.set(recipient._id.toString(), currentUnread + 1);
  await conversation.save({ validateBeforeSave: false });

  await createNotification({
    recipient: recipient._id,
    sender: req.user.id,
    type: 'new_message',
    title: 'New Message',
    message: content,
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

// @desc    Get unread chat messages count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({ receiver: req.user.id, isRead: false });
  res.status(200).json({ success: true, count });
});

// @desc    Update a message
// @route   PATCH /api/messages/:id
// @access  Private
exports.updateMessage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid message ID.', 400));
  }

  if (!content || !content.trim()) {
    return next(new AppError('Message content cannot be empty.', 400));
  }

  const message = await Message.findById(id);
  if (!message) return next(new AppError('Message not found.', 404));

  if (message.sender.toString() !== req.user.id.toString()) {
    return next(new AppError('You are not allowed to edit this message.', 403));
  }

  if (message.isDeleted) {
    return next(new AppError('Cannot edit a deleted message.', 400));
  }

  message.content = content.trim();
  message.updatedAt = Date.now();
  await message.save({ validateBeforeSave: false });

  const updatedMessage = await Message.findById(message._id)
    .populate('sender', 'firstName lastName avatar');

  sendUpdatedMessageToChat(message.conversation.toString(), {
    ...updatedMessage.toObject(),
  });

  res.status(200).json({ success: true, data: updatedMessage });
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid message ID.', 400));
  }

  const message = await Message.findById(id);
  if (!message) return next(new AppError('Message not found.', 404));

  if (message.sender.toString() !== req.user.id.toString()) {
    return next(new AppError('You are not allowed to delete this message.', 403));
  }

  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) return next(new AppError('Conversation not found.', 404));

  const wasLastMessage = conversation.lastMessage?.toString() === message._id.toString();

  await message.deleteOne();

  if (wasLastMessage) {
    const previousMessage = await Message.findOne({ conversation: conversation._id })
      .sort({ createdAt: -1 });

    if (previousMessage) {
      conversation.lastMessage = previousMessage._id;
      conversation.lastMessageAt = previousMessage.createdAt;
    } else {
      conversation.lastMessage = undefined;
      conversation.lastMessageAt = undefined;
    }

    await conversation.save({ validateBeforeSave: false });
  }

  sendDeletedMessageToChat(conversation._id.toString(), message._id.toString());

  res.status(200).json({ success: true, message: 'Message deleted successfully.' });
});
