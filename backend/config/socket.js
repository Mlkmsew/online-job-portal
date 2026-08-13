// ============================================
// Socket.IO Configuration
// ============================================
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

let io;
const userSocketMap = new Map(); // userId -> socketId mapping

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);
    
    // Store user-socket mapping
    userSocketMap.set(socket.userId, socket.id);
    
    // Emit online users
    emitOnlineUsers();

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining chat rooms
    socket.on('join-chat', ({ chatId }) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat: ${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', ({ chatId }) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left chat: ${chatId}`);
    });

    // Handle sending messages
    socket.on('send-message', ({ chatId, message }) => {
      // Broadcast message to chat room
      io.to(chatId).emit('new-message', {
        ...message,
        timestamp: new Date(),
      });
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('user-typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // Handle mark as read
    socket.on('mark-read', ({ chatId, messageId }) => {
      io.to(chatId).emit('message-read', {
        messageId,
        readBy: socket.userId,
        timestamp: new Date(),
      });
    });

    // Handle notifications
    socket.on('send-notification', ({ userId, notification }) => {
      const recipientSocketId = userSocketMap.get(userId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification', notification);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      userSocketMap.delete(socket.userId);
      emitOnlineUsers();
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// Emit online users to all connected clients
const emitOnlineUsers = () => {
  const onlineUsers = Array.from(userSocketMap.keys());
  io.emit('online-users', onlineUsers);
};

// Send notification to specific user
const sendNotification = (userId, notification) => {
  const socketId = userSocketMap.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit('notification', notification);
  }
};

// Send message to specific chat
const sendMessageToChat = (chatId, message) => {
  if (io) {
    io.to(chatId).emit('new-message', message);
  }
};

// Send message directly to a user's personal room (always delivered when online)
const sendMessageToUser = (userId, message) => {
  if (io) {
    io.to(userId.toString()).emit('message-received', message);
  }
};

const sendUpdatedMessageToChat = (chatId, message) => {
  if (io) {
    io.to(chatId).emit('message-updated', message);
  }
};

const sendDeletedMessageToChat = (chatId, messageId) => {
  if (io) {
    io.to(chatId).emit('message-deleted', { _id: messageId, conversation: chatId });
  }
};

// Broadcast to all users
const broadcastToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Get online users count
const getOnlineUsersCount = () => {
  return userSocketMap.size;
};

// Check if user is online
const isUserOnline = (userId) => {
  return userSocketMap.has(userId.toString());
};

module.exports = {
  initializeSocket,
  sendNotification,
  sendMessageToChat,
  sendMessageToUser,
  sendUpdatedMessageToChat,
  sendDeletedMessageToChat,
  broadcastToAll,
  getOnlineUsersCount,
  isUserOnline,
};
