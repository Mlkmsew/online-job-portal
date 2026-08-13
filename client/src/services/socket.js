// ============================================
// Socket.IO Client Configuration
// ============================================
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.globalListeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket?.disconnected) {
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      const callback = this.listeners.get(event);
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  // App-wide listeners that can coexist with page-level listeners (socket.io
  // supports multiple callbacks per event, so `onGlobal` never overwrites
  // listeners registered through `on` and vice-versa).
  onGlobal(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
    if (!this.globalListeners.has(event)) this.globalListeners.set(event, new Set());
    this.globalListeners.get(event).add(callback);
  }

  offGlobal(event, callback) {
    if (!this.socket || !this.globalListeners.has(event)) return;
    if (callback) {
      this.socket.off(event, callback);
      this.globalListeners.get(event).delete(callback);
    } else {
      this.globalListeners.get(event).forEach((cb) => this.socket.off(event, cb));
      this.globalListeners.delete(event);
    }
  }

  // Chat specific methods
  joinChat(chatId) {
    this.emit('join-chat', { chatId });
  }

  leaveChat(chatId) {
    this.emit('leave-chat', { chatId });
  }

  sendMessage(chatId, message) {
    this.emit('send-message', { chatId, message });
  }

  typing(chatId, isTyping) {
    this.emit('typing', { chatId, isTyping });
  }

  markAsRead(chatId, messageId) {
    this.emit('mark-read', { chatId, messageId });
  }
}

export default new SocketService();
