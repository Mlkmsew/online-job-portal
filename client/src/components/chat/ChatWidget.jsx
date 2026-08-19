// ============================================
// Floating Chat Widget - Real-time Messaging
// ============================================
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import socketService from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) {
      // Connect to Socket.IO
      socketService.connect(token);

      // Listen for new messages
      socketService.on('new-message', (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      // Listen for typing indicator
      socketService.on('user-typing', ({ userId, isTyping }) => {
        setIsTyping(isTyping);
      });

      // Listen for online users
      socketService.on('online-users', (users) => {
        setOnlineUsers(users);
      });

      // Listen for notifications
      socketService.on('notification', (notification) => {
        console.log('New notification:', notification);
      });

      return () => {
        socketService.off('new-message');
        socketService.off('user-typing');
        socketService.off('online-users');
        socketService.off('notification');
      };
    }
  }, [token, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const message = {
      text: inputMessage,
      sender: user._id,
      timestamp: new Date(),
    };

    socketService.sendMessage('general', message);
    setMessages((prev) => [...prev, message]);
    setInputMessage('');
    scrollToBottom();
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    socketService.typing('general', e.target.value.length > 0);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white rounded-full p-4 shadow-lg z-50 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Open Chat"
      >
        {isOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
        {onlineUsers.length > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {onlineUsers.length}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-3 sm:right-6 w-[calc(100vw-1.5rem)] max-w-96 h-[min(500px,calc(100vh-7rem))] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Chat Header */}
            <div className="bg-teal-600 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Messages</h3>
                <p className="text-xs opacity-90">
                  {onlineUsers.length} online
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-teal-700 rounded-full p-2 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <FaComments className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === user._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg ${
                        msg.sender === user._id
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
