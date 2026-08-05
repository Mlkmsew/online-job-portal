import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiMail, FiMessageCircle, FiSend, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { getConversations, getMessages, sendMessage } from '../../../services/messageService';
import socketService from '../../../services/socket';
import useAuth from '../../../hooks/useAuth';

const Messages = () => {
  const { user } = useAuth();
  const currentUserId = user?._id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const conversationIdFromUrl = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConversationEmail, setNewConversationEmail] = useState('');
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res = await getConversations();
      setConversations(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await getMessages(conversationId);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.response?.data?.message || 'Unable to load messages.');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/dashboard/messages?conversationId=${conversation._id}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const recipient = selectedConversation.participants.find((p) => p._id !== currentUserId);
      const payload = {
        conversationId: selectedConversation._id,
        recipientId: recipient?._id,
        content: inputMessage.trim(),
      };

      const res = await sendMessage(payload);
      setMessages((prev) => [...prev, res.data.data.message]);
      setInputMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Send message failed:', err);
      setError(err.response?.data?.message || 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartNewConversation = async (e) => {
    e.preventDefault();
    if (!newConversationEmail.trim() || !newConversationMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await sendMessage({
        recipientId: newConversationEmail.trim(),
        content: newConversationMessage.trim(),
      });

      await loadConversations();
      const createdConversation = res.data.data.conversation;
      setSelectedConversation(createdConversation);
      setMessages([res.data.data.message]);
      setIsModalOpen(false);
      setNewConversationEmail('');
      setNewConversationMessage('');
      navigate(`/dashboard/messages?conversationId=${createdConversation._id}`);
    } catch (err) {
      console.error('Start conversation failed:', err);
      setError(err.response?.data?.message || 'Unable to start conversation.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationIdFromUrl) {
      const match = conversations.find((c) => c._id === conversationIdFromUrl);
      if (match) {
        setSelectedConversation(match);
      }
      loadMessages(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl, conversations]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = socketService.connect(token);
    if (!socket) return;

    if (selectedConversation?._id) {
      socketService.joinChat(selectedConversation._id);
    }

    socketService.on('new-message', (message) => {
      if (message.conversation === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }

      loadConversations();
    });

    socketService.on('message-read', () => {
      loadConversations();
    });

    return () => {
      if (selectedConversation?._id) {
        socketService.leaveChat(selectedConversation._id);
      }
      socketService.off('new-message');
      socketService.off('message-read');
    };
  }, [selectedConversation]);

  const selectedParticipant = useMemo(() => {
    if (!selectedConversation) return null;
    return selectedConversation.participants.find((participant) => participant._id !== currentUserId);
  }, [selectedConversation, currentUserId]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Messages</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Chat with employers, recruiters, and support while tracking your conversation history.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700 transition"
        >
          <FiPlus className="w-4 h-4" /> Start a new conversation
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_0.65fr]">
        <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-400 mb-6 flex items-center justify-between">
            <span>Recent conversations</span>
            {isLoading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>

          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
                No conversations yet. Start a new chat to connect with employers or support.
              </div>
            ) : (
              conversations.map((conversation) => {
                const participant = conversation.participants.find((participant) => participant._id !== currentUserId);
                const lastMessage = conversation.lastMessage?.content || 'No messages yet';
                return (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left rounded-3xl border px-4 py-4 transition ${selectedConversation?._id === conversation._id ? 'border-emerald-300 bg-emerald-50 dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'} `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{participant?.firstName} {participant?.lastName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[320px]">{lastMessage}</p>
                      </div>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 rounded-full px-3 py-1">
                  {(() => {
                    const count = conversation.unreadCount;
                    if (typeof count === 'number') return count > 0 ? 'Unread' : 'Read';
                    if (count?.get) return count.get(currentUserId) > 0 ? 'Unread' : 'Read';
                    return count?.[currentUserId] > 0 ? 'Unread' : 'Read';
                  })()}
                </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm flex flex-col h-full">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <button type="button" onClick={() => navigate('/dashboard/messages')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Conversation</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedParticipant?.firstName} {selectedParticipant?.lastName}</h3>
                </div>
              </div>
              <div className="mb-4 overflow-y-auto max-h-[520px] space-y-3 pr-2">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.sender === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-3xl p-4 max-w-[85%] ${message.sender === currentUserId ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-2 text-right">{new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="mt-auto">
                <div className="flex gap-3">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                  />
                  <button type="submit" disabled={!inputMessage.trim() || isSending} className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
                    <FiSend className="w-4 h-4" /> Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
              <FiMessageCircle className="mx-auto mb-4 w-12 h-12 text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select a conversation to start chatting</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Choose a recent thread or start a new conversation now.</p>
            </div>
          )}
        </aside>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Start a new conversation</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter the recipient email and your first message.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">Cancel</button>
            </div>
            {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleStartNewConversation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient email</label>
                <input
                  value={newConversationEmail}
                  onChange={(e) => setNewConversationEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                  placeholder="recipient@example.com"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  value={newConversationMessage}
                  onChange={(e) => setNewConversationMessage(e.target.value)}
                  className="mt-2 w-full min-h-[150px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                  placeholder="Write your message here..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSending} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
                  {isSending ? 'Sending...' : 'Start conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
