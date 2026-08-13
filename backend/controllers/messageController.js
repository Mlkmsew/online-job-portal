const mongoose = require('mongoose');
const { Conversation, Message } = require('../models/Message');
const User = require('../models/user');
const Company = require('../models/Company');
const { asyncHandler, createNotification, escapeRegex } = require('../utils/helpers');
const { sendEmail, emailTemplates, getClientURL } = require('../config/email');
const { sendMessageToChat, sendMessageToUser, sendUpdatedMessageToChat, sendDeletedMessageToChat } = require('../config/socket');
const { AppError } = require('../middleware/errorHandler');

// Attach the company profile to employer participants so the UI can show it.
// Skips null / unresolved participant slots (references that point to users
// that no longer exist) instead of crashing.
const attachCompanies = async (participants) => {
  const valid = (participants || []).filter((p) => p && p._id);
  const employerIds = valid.filter((p) => p.role === 'employer').map((p) => p._id);
  if (!employerIds.length) return valid;
  const companies = await Company.find({ owner: { $in: employerIds } }).select('name logo owner');
  const byOwner = new Map(companies.map((c) => [c.owner.toString(), { name: c.name, logo: c.logo }]));
  return valid.map((p) => {
    const plain = p.toObject ? p.toObject() : { ...p };
    if (plain.role === 'employer' && byOwner.has(plain._id.toString())) {
      plain.company = byOwner.get(plain._id.toString());
    }
    return plain;
  });
};

// @desc    Get the current user's conversations
// @route   GET /api/messages
// @access  Private
exports.getConversations = asyncHandler(async (req, res) => {
  const raw = await Conversation.find({ participants: req.user.id, archivedBy: { $nin: [req.user.id] } })
    .populate('participants', 'firstName lastName avatar role email')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'firstName lastName avatar role' } })
    .sort({ lastMessageAt: -1 });

  const me = String(req.user.id);

  const conversations = await Promise.all(
    raw.map(async (conversation) => {
      const plain = conversation.toJSON();

      // A participant slot that no longer resolves to a real user will show
      // as null after populate. Drop those slots and log them for debugging so
      // the UI can fall back to "Unknown" instead of rendering broken data.
      const populated = plain.participants || [];
      const valid = populated.filter((p) => p && p._id);
      if (valid.length !== populated.length) {
        console.warn(
          `[messages] Conversation ${conversation._id} has ${populated.length - valid.length} participant reference(s) that do not resolve to a real user.`
        );
      }

      plain.participants = await attachCompanies(valid);

      // Resolve the OTHER side of the conversation (the real sender/recipient
      // that is not the current user) on the server so the API returns the
      // actual participant instead of leaving the UI to guess. `participant`
      // stays null only when the conversation references users that no longer
      // exist (in which case the UI falls back to "Unknown").
      const other = plain.participants.find((p) => p && p._id && String(p._id) !== me) || null;
      if (!other) {
        console.warn(
          `[messages] Conversation ${conversation._id} has no resolvable participant other than the current user (${me}).`
        );
      }
      plain.participant = other;

      return plain;
    })
  );

  res.status(200).json({ success: true, count: conversations.length, data: conversations });
});

// @desc    Search users that the admin can start a conversation with
// @route   GET /api/messages/recipients
// @access  Private (authenticated)
exports.searchRecipients = asyncHandler(async (req, res) => {
  const { q = '', role } = req.query;

  // Normalize role filter. 'support' maps to the established 'admin' role
  // (the platform's support staff), 'all'/missing means every eligible role.
  const roleMap = {
    employer: 'employer',
    jobseeker: 'jobseeker',
    job_seeker: 'jobseeker',
    jobSeeker: 'jobseeker',
    support: 'admin',
    admin: 'admin',
    all: null,
  };

  const query = {
    _id: { $ne: req.user.id },
    isActive: true,
    isSuspended: false,
  };

  const resolvedRole = role ? roleMap[String(role).toLowerCase()] : null;
  if (resolvedRole) query.role = resolvedRole;

  const safe = q && q.trim() ? escapeRegex(q.trim()) : '';

  if (safe) {
    query.$or = [
      { firstName: new RegExp(safe, 'i') },
      { lastName: new RegExp(safe, 'i') },
      { email: new RegExp(safe, 'i') },
      // combined full name search (e.g. "Solomon Tadesse")
      { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: safe, options: 'i' } } },
    ];
  }

  let users = await User.find(query)
    .select('firstName lastName email avatar role')
    .sort({ firstName: 1 })
    .limit(30);

  // Company-name search: also return employers whose registered company matches
  if (safe) {
    const companies = await Company.find({ name: new RegExp(safe, 'i') })
      .select('owner name logo')
      .limit(25);
    if (companies.length) {
      const ownerIds = [...new Set(companies.map((c) => c.owner?.toString()).filter(Boolean))];
      const companyUsers = await User.find({
        _id: { $in: ownerIds, $ne: req.user.id },
        isActive: true,
        isSuspended: false,
        ...(resolvedRole ? { role: resolvedRole } : {}),
      }).select('firstName lastName email avatar role');
      const seen = new Set(users.map((u) => u._id.toString()));
      for (const companyUser of companyUsers) {
        if (!seen.has(companyUser._id.toString())) users.push(companyUser);
      }
    }
  }

  const data = await attachCompanies(users);

  const recipients = data.map((u) => ({
    _id: u._id,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    avatar: u.avatar || null,
    ...(u.company ? { company: u.company } : {}),
  }));

  res.status(200).json({ success: true, count: recipients.length, data: recipients, recipients });
});

// @desc    Upload a chat message attachment
// @route   POST /api/messages/upload
// @access  Private
exports.uploadAttachment = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const isImage = (req.file.mimetype || '').startsWith('image/');
  res.status(200).json({
    success: true,
    data: {
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      type: isImage ? 'image' : 'file',
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
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

  // Resolve the REAL recipient user BEFORE creating (or reusing) any
  // conversation. Creating a conversation first could leave a phantom
  // participant (a user id that does not exist) behind, which the UI can
  // never resolve to a real name.
  const recipient = await User.findById(recipientId).select('firstName email isActive isSuspended');
  if (!recipient) {
    console.warn(`[messages] sendMessage: recipient user ${recipientId} does not exist for sender ${req.user.id}.`);
    return next(new AppError('No user found with this email.', 404));
  }

  conversation = await Conversation.findOne({ participants: { $all: [req.user.id, recipientId] } });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, recipientId],
      lastMessageAt: new Date(),
      unreadCount: { [recipientId]: 0, [req.user.id]: 0 },
    });
  } else {
    // An active message thread must not stay archived for its participants:
    // otherwise a real incoming/outgoing message is hidden from their inbox.
    conversation.archivedBy = (conversation.archivedBy || []).filter(
      (id) => !id.equals(req.user.id) && !id.equals(recipientId)
    );
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
  sendMessageToUser(recipient._id.toString(), socketPayload);

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

// @desc    Mark a conversation as read for the current user
// @route   PATCH /api/messages/conversations/:id/read
// @access  Private
exports.markConversationRead = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new AppError('Conversation not found.', 404));
  if (!conversation.participants.some((p) => p.toString() === req.user.id.toString())) {
    return next(new AppError('Not authorized to update this conversation.', 403));
  }

  await Message.updateMany(
    { conversation: conversation._id, receiver: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  if (conversation.unreadCount?.get(req.user.id.toString())) {
    conversation.unreadCount.set(req.user.id.toString(), 0);
    await conversation.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message: 'Conversation marked as read.' });
});

// @desc    Mark a conversation as unread for the current user
// @route   PATCH /api/messages/conversations/:id/unread
// @access  Private
exports.markConversationUnread = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new AppError('Conversation not found.', 404));
  if (!conversation.participants.some((p) => p.toString() === req.user.id.toString())) {
    return next(new AppError('Not authorized to update this conversation.', 403));
  }

  conversation.unreadCount = conversation.unreadCount || new Map();
  conversation.unreadCount.set(req.user.id.toString(), 1);
  await conversation.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Conversation marked as unread.' });
});

// @desc    Archive / un-archive a conversation for the current user
// @route   PATCH /api/messages/conversations/:id/archive
// @access  Private
exports.toggleArchiveConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new AppError('Conversation not found.', 404));
  if (!conversation.participants.some((p) => p.toString() === req.user.id.toString())) {
    return next(new AppError('Not authorized to update this conversation.', 403));
  }

  conversation.archivedBy = conversation.archivedBy || [];
  const idStr = req.user.id.toString();
  const idx = conversation.archivedBy.findIndex((p) => p.toString() === idStr);
  if (idx > -1) {
    conversation.archivedBy.splice(idx, 1);
  } else {
    conversation.archivedBy.push(req.user.id);
  }
  await conversation.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, archived: idx === -1, message: idx === -1 ? 'Conversation archived.' : 'Conversation restored.' });
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
