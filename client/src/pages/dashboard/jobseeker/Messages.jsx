import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMail, FiMessageCircle, FiSend, FiPlus, FiArrowLeft, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { getConversations, getMessages, sendMessage, updateMessage, deleteMessage } from '../../../services/messageService';
import socketService from '../../../services/socket';
import useAuth from '../../../hooks/useAuth';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentUserId = user?._id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const conversationIdFromUrl = searchParams.get('conversationId');
  const recipientFromUrl = searchParams.get('recipient');
  const recipientEmailFromUrl = searchParams.get('recipientEmail');
  const location = useLocation();

  const basePath = location.pathname.startsWith('/employer')
    ? '/employer'
    : location.pathname.startsWith('/admin')
      ? '/admin'
      : '/dashboard';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuMessage, setActionMenuMessage] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [editMessageId, setEditMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');

  const messagesEndRef = useRef(null);
  const actionMenuRef = useRef(null);
  const editTextareaRef = useRef(null);
  const openedForRecipientRef = useRef(null);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeout = setTimeout(() => {
      setSuccessMessage('');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [successMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getConversations();
      setConversations(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err.response?.data?.message || t('messages.loadFailed') || 'Unable to load conversations.');
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
      await loadConversations();
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.response?.data?.message || t('messages.loadMessagesFailed') || 'Unable to load messages.');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`${basePath}/messages?conversationId=${conversation._id}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConversation?._id || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccessMessage('');
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
      setError(err.response?.data?.message || t('messages.sendFailed') || 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const closeActionMenu = () => {
    setActionMenuVisible(false);
    setActionMenuMessage(null);
  };

  const handleOpenActionMenu = (event, message) => {
    if (editMessageId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const top = rect.top + window.scrollY + 24;
    const left = Math.min(
      Math.max(12, rect.left + window.scrollX + rect.width - 180),
      window.innerWidth - 208 - 12
    );

    setActionMenuVisible(true);
    setActionMenuMessage(message);
    setActionMenuPosition({ top, left });
  };

  const handleEditMessage = (message) => {
    setEditMessageId(message._id);
    setEditMessageText(message.content || '');
    closeActionMenu();
  };

  const handleDeleteMessage = async (message) => {
    closeActionMenu();
    const confirmed = window.confirm(t('messages.deleteConfirm', { defaultValue: 'Are you sure you want to delete this message?' }));
    if (!confirmed) return;

    try {
      await deleteMessage(message._id);
      setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
      setSuccessMessage(t('messages.deletedSuccess', { defaultValue: 'Message deleted successfully.' }));
    } catch (err) {
      console.error('Delete message failed:', err);
      setError(err.response?.data?.message || t('messages.deleteFailed', { defaultValue: 'Unable to delete message.' }));
    }
  };

  const handleSaveEditedMessage = async () => {
    if (!editMessageText.trim()) {
      setError(t('admin.messages.editEmpty', { defaultValue: 'Message cannot be empty.' }));
      return;
    }

    try {
      const res = await updateMessage(editMessageId, editMessageText.trim());
      setMessages((prev) => prev.map((msg) => (msg._id === editMessageId ? res.data.data : msg)));
      setSuccessMessage(t('messages.updatedSuccess', { defaultValue: 'Message updated successfully.' }));
      setEditMessageId(null);
      setEditMessageText('');
    } catch (err) {
      console.error('Update message failed:', err);
      setError(err.response?.data?.message || t('messages.updateFailed', { defaultValue: 'Unable to update message.' }));
    }
  };

  const handleCancelEdit = () => {
    setEditMessageId(null);
    setEditMessageText('');
  };

  const handleStartNewConversation = async (e) => {
    e.preventDefault();
    if (!newConversationEmail.trim() || !newConversationMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccessMessage('');
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
      setSuccessMessage(t('messages.startSuccess') || 'Conversation started successfully.');
      navigate(`${basePath}/messages?conversationId=${createdConversation._id}`);
    } catch (err) {
      console.error('Start conversation failed:', err);
      setError(err.response?.data?.message || t('messages.startFailed') || 'Unable to start conversation.');
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
    if (!recipientFromUrl) return;

    const match = conversations.find((c) =>
      (c.participants || []).some((participant) => participant?._id?.toString() === recipientFromUrl.toString())
    );
    if (match) {
      setIsModalOpen(false);
      setSelectedConversation(match);
      loadMessages(match._id);
      return;
    }
    if (openedForRecipientRef.current === recipientFromUrl.toString()) return;
    openedForRecipientRef.current = recipientFromUrl.toString();
    setNewConversationEmail(recipientEmailFromUrl || '');
    setIsModalOpen(true);
  }, [recipientFromUrl, recipientEmailFromUrl, conversations]);

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

    socketService.on('message-updated', (message) => {
      if (message.conversation === selectedConversation?._id) {
        setMessages((prev) => prev.map((msg) => (msg._id === message._id ? message : msg)));
      }
    });

    socketService.on('message-deleted', ({ _id, conversation }) => {
      if (conversation === selectedConversation?._id) {
        setMessages((prev) => prev.filter((msg) => msg._id !== _id));
      }
    });

    socketService.on('message-read', () => {
      loadConversations();
    });

    return () => {
      if (selectedConversation?._id) {
        socketService.leaveChat(selectedConversation._id);
      }
      socketService.off('new-message');
      socketService.off('message-updated');
      socketService.off('message-deleted');
      socketService.off('message-read');
    };
  }, [selectedConversation]);

  const selectedParticipant = useMemo(() => {
    if (!selectedConversation) return null;
    return selectedConversation.participants.find((participant) => participant._id !== currentUserId);
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (actionMenuVisible && actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        closeActionMenu();
      }
    };

    if (actionMenuVisible) {
      window.addEventListener('mousedown', handleOutsideClick);
      return () => window.removeEventListener('mousedown', handleOutsideClick);
    }
    return undefined;
  }, [actionMenuVisible]);

  useEffect(() => {
    if (!editMessageId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCancelEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMessageId]);

  useEffect(() => {
    if (editMessageId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const length = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }, [editMessageId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (editMessageId) {
          handleCancelEdit();
        } else if (actionMenuVisible) {
          closeActionMenu();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [editMessageId, actionMenuVisible]);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('dashboard.messages.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('messages.subtitle') || 'Chat with employers, recruiters, and support while tracking your conversation history.'}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-5 py-3 text-white font-semibold hover:bg-[#0D5BC4] transition"
        >
          <FiPlus className="w-4 h-4" /> {t('messages.startNewConversation') || 'Start a new conversation'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_0.65fr]">
        <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-400 mb-6 flex items-center justify-between">
            <span>{t('messages.recentConversations') || 'Recent conversations'}</span>
            {isLoading && <span className="text-xs text-gray-500">{t('common.loading')}</span>}
          </div>
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">{successMessage}</div>
          )}
          {conversations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
              {t('messages.noConversations') || 'No conversations yet. Start a new chat to connect with employers or support.'}
            </div>
          ) : (
            conversations.map((conversation) => {
              const participant = conversation.participants.find((participant) => participant._id !== currentUserId);
              const lastMessage = conversation.lastMessage?.content || t('messages.noMessagesYet') || 'No Messages Yet';
                const unreadCount = (() => {
                  const count = conversation.unreadCount;
                  if (typeof count === 'number') return count;
                  if (count?.get) return count.get(currentUserId) || 0;
                  return count?.[currentUserId] || 0;
                })();

                return (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left rounded-3xl border px-4 py-4 transition ${selectedConversation?._id === conversation._id ? 'border-[#1769E0] bg-[#EAF2FE] dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700 hover:border-[#1769E0]'} `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{`${participant?.firstName || ''} ${participant?.lastName || ''}`.trim()}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[320px]">{lastMessage}</p>
                      </div>
                      {unreadCount > 0 ? (
                        <span className="text-xs font-semibold text-white bg-rose-600 rounded-full px-3 py-1">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                          {t('messages.read') || 'Read'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
          )}
        </div>

        <aside className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm flex flex-col h-full">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <button type="button" onClick={() => navigate(`${basePath}/messages`)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <FiArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">{t('messages.conversation') || 'Conversation'}</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedParticipant?.firstName} {selectedParticipant?.lastName}</h3>
                </div>
              </div>
              <div className="mb-4 overflow-y-auto max-h-[520px] space-y-3 pr-2">
                {messages.map((message) => {
                  const senderId = message.sender?._id?.toString?.() || message.sender?.toString?.();
                  const isMine = senderId === currentUserId?.toString();

                  return (
                    <div
                      key={message._id}
                      className={`relative flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div
                        onClick={(e) => isMine && handleOpenActionMenu(e, message)}
                        onContextMenu={(e) => isMine && handleOpenActionMenu(e, message)}
                        className={`max-w-[85%] p-4 text-sm shadow-sm cursor-pointer ${isMine ? 'bg-[#1769E0] text-white rounded-[18px_18px_4px_18px] hover:bg-[#0D5BC4]' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-[18px_18px_18px_4px]'}`}>
                        {editMessageId === message._id ? (
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              ref={editTextareaRef}
                              value={editMessageText}
                              onChange={(e) => setEditMessageText(e.target.value)}
                              className="w-full min-h-[120px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20">
                                {t('common.cancel')}
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveEditedMessage(); }} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1769E0] hover:bg-[#DCEAFD]">
                                {t('common.save')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            {message.updatedAt && message.updatedAt !== message.createdAt && (
                              <span className="mt-2 block text-[11px] opacity-80">({t('messages.edited') || 'edited'})</span>
                            )}
                            <p className={`mt-2 text-xs ${isMine ? 'text-blue-100 text-right' : 'text-gray-500 dark:text-gray-400 text-left'}`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {actionMenuVisible && actionMenuMessage && (
                <div
                  ref={actionMenuRef}
                  style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                  className="fixed z-50 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => handleEditMessage(actionMenuMessage)}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiEdit2 className="h-4 w-4" />
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(actionMenuMessage)}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    {t('common.delete')}
                  </button>
                  <button
                    type="button"
                    onClick={closeActionMenu}
                    className="mt-2 flex w-full items-center justify-center rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    <FiX className="h-4 w-4" /> {t('common.cancel')}
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="mt-auto">
                <div className="flex gap-3">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={t('messages.typePlaceholder') || 'Type your message...'}
                    className="flex-1 rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                  />
                  <button type="submit" disabled={!inputMessage.trim() || isSending} className="inline-flex items-center gap-2 rounded-3xl bg-[#1769E0] px-5 py-3 text-white font-semibold hover:bg-[#0D5BC4] disabled:cursor-not-allowed disabled:bg-[#A8C8F5]">
                    <FiSend className="w-4 h-4" /> {t('common.submit')}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
              <FiMessageCircle className="mx-auto mb-4 w-12 h-12 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('messages.selectConversationTitle') || 'Select a conversation to start chatting'}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('messages.selectConversationSubtitle') || 'Choose a recent thread or start a new conversation now.'}</p>
            </div>
          )}
        </aside>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('messages.startNewConversation') || 'Start a new conversation'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('messages.newConversationSubtitle') || 'Enter the recipient email and your first message.'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">{t('common.cancel')}</button>
            </div>
            {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleStartNewConversation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.email')}</label>
                <input
                  value={newConversationEmail}
                  onChange={(e) => setNewConversationEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                  placeholder={t('messages.recipientEmailPlaceholder', { defaultValue: 'recipient@example.com' })}
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.messages.title')}</label>
                <textarea
                  value={newConversationMessage}
                  onChange={(e) => setNewConversationMessage(e.target.value)}
                  className="mt-2 w-full min-h-[150px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                  placeholder={t('messages.typePlaceholder') || 'Write your message here...'}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSending} className="rounded-full bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D5BC4] disabled:cursor-not-allowed disabled:bg-[#A8C8F5]">
                  {isSending ? t('common.loading') : t('messages.startConversation') || 'Start conversation'}
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
