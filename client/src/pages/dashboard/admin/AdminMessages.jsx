import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { format, isToday, isYesterday } from 'date-fns';
import {
  FiSearch,
  FiSend,
  FiPaperclip,
  FiSmile,
  FiPlus,
  FiArrowLeft,
  FiMail,
  FiMessageCircle,
  FiMoreVertical,
  FiCheck,
  FiCheckCircle,
  FiDownload,
  FiFile,
  FiX,
  FiClock,
  FiAlertCircle,
  FiArchive,
  FiInbox,
  FiLoader,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  getConversations,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  searchRecipients,
  uploadAttachment,
  markConversationRead,
  markConversationUnread,
  toggleArchiveConversation,
} from '../../../services/messageService';
import socketService from '../../../services/socket';
import { fetchUnreadCount } from '../../../store/slices/messagesSlice';

const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const ACCEPTED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EMOJIS = ['😀', '😊', '👍', '🙏', '❤️', '🎉', '✅', '👏', '🤝', '💼', '📄', '📅', '🔔', '⭐', '🚀', '😅'];

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────
const getUnread = (conversation, userId) => {
  const count = conversation?.unreadCount;
  if (!count) return 0;
  if (typeof count === 'number') return count;
  if (count.get && typeof count.get === 'function') return count.get(userId) || 0;
  return count[userId] || 0;
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
};

const formatFullTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'd MMM yyyy, h:mm a');
};

const getInitials = (name) =>
  (name || '?')
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

// Resolve the real display name of a participant using the same priority the
// rest of the app uses: first + last name, fullName, company name, email.
const getParticipantName = (participant) => {
  if (!participant) return 'Unknown';
  const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
  if (fullName) return fullName;
  if (participant.fullName) return participant.fullName;
  if (participant.company?.name) return participant.company.name;
  if (participant.email) return participant.email;
  return 'Unknown';
};

// The "other" side of the conversation. The backend resolves the real
// sender/recipient for every conversation and returns it as
// `conversation.participant`. We prefer that resolved value and only fall back
// to deriving it from the participants array for safety. An unresolved/invalid
// reference yields undefined here and is handled by the "Unknown" fallback
// rather than rendering a fake user.
const getOtherParticipant = (conversation, currentUserId) => {
  if (conversation?.participant) return conversation.participant;
  if (!conversation?.participants) return undefined;
  const me = currentUserId?.toString?.() || currentUserId;
  return conversation.participants.find((p) => p?._id && (p._id.toString?.() || p._id) !== me);
};

// Only "Unknown" when the conversation truly has no valid participant data.
const getParticipantRoleMeta = (participant) =>
  (participant?.role && ROLE_STYLE[participant.role]) || ROLE_STYLE.unknown;

const getParticipantAvatarMeta = (participant) =>
  (participant?.role && ROLE_AVATAR[participant.role]) || ROLE_AVATAR.unknown;

const ROLE_STYLE = {
  employer: { label: 'Employer', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  jobseeker: { label: 'Job Seeker', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  admin: { label: 'Support', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  unknown: { label: 'Unknown', cls: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600' },
};

const ROLE_AVATAR = {
  employer: 'bg-amber-100 text-amber-700',
  jobseeker: 'bg-sky-100 text-sky-700',
  admin: 'bg-violet-100 text-violet-700',
  unknown: 'bg-gray-200 text-gray-600',
};

const isFileImage = (message) =>
  message?.type === 'image' || (message?.fileUrl && /\.(jpe?g|png|webp)$/i.test(message.fileUrl || ''));

// ─────────────────────────────────────────────────────────────
// Skeleton loaders
// ─────────────────────────────────────────────────────────────
const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
    <div className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-2.5 w-4/5 rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  </div>
);

const MessageSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 animate-pulse">
    <div className="flex justify-end">
      <div className="h-10 w-2/3 rounded-2xl rounded-br-md bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="flex justify-start">
      <div className="h-10 w-1/2 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800" />
    </div>
    <div className="flex justify-end">
      <div className="h-10 w-3/5 rounded-2xl rounded-br-md bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
const AdminMessages = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversationId');
  const preselectedRecipientId = location.state?.recipientId || null;
  const preselectedRecipientName = location.state?.recipientName || '';
  const { user } = useSelector((state) => state.auth);
  const onlineUsers = useSelector((state) => state.messages.onlineUsers);
  const currentUserId = user?._id;

  // ── State ──
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  const [selectedId, setSelectedId] = useState(conversationIdFromUrl || null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientRole, setRecipientRole] = useState('all');
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);

  // ── Message edit / delete state ──
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuMessage, setActionMenuMessage] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [editMessageId, setEditMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const actionMenuRef = useRef(null);
  const editTextareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  // ── Conversation loading ──
  const loadConversations = useCallback(async () => {
    setConversationsError(null);
    try {
      const res = await getConversations();
      setConversations(res.data?.data || []);
    } catch (err) {
      setConversationsError(err.response?.data?.message || 'Unable to load messages.');
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // ── Messages loading (also marks the conversation read server-side) ──
  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const res = await getMessages(conversationId);
        setMessages(res.data?.data || []);
        await loadConversations();
        dispatch(fetchUnreadCount());
      } catch (err) {
        setMessagesError(err.response?.data?.message || 'Unable to load this conversation.');
      } finally {
        setMessagesLoading(false);
        scrollToBottom();
      }
    },
    [loadConversations, dispatch, scrollToBottom]
  );

  useEffect(() => {
    loadConversations();
    dispatch(fetchUnreadCount());
  }, [loadConversations, dispatch]);

  // Select conversation from URL once conversations have loaded
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length) {
      const exists = conversations.some((c) => c._id === conversationIdFromUrl);
      if (exists && selectedId !== conversationIdFromUrl) {
        setSelectedId(conversationIdFromUrl);
        loadMessages(conversationIdFromUrl);
      }
    }
  }, [conversationIdFromUrl, conversations, selectedId, loadMessages]);

  useEffect(() => {
    if (preselectedRecipientId) {
      setSelectedRecipient({ _id: preselectedRecipientId, firstName: preselectedRecipientName.split(' ')[0] || '', lastName: preselectedRecipientName.split(' ').slice(1).join('') || '' });
      setNewMessageOpen(true);
      navigate('/admin/messages', { replace: true, state: {} });
    }
  }, [preselectedRecipientId, preselectedRecipientName, navigate]);

  const handleSelectConversation = (conversation) => {
    setSelectedId(conversation._id);
    navigate(`/admin/messages?conversationId=${conversation._id}`, { replace: true });
    loadMessages(conversation._id);
  };

  const handleBackToList = () => {
    setSelectedId(null);
    navigate('/admin/messages', { replace: true });
  };

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId]
  );

  const selectedParticipant = useMemo(() => {
    if (!selectedConversation) return null;
    return getOtherParticipant(selectedConversation, currentUserId) || null;
  }, [selectedConversation, currentUserId]);

  const isParticipantOnline = (participant) =>
    !!participant && onlineUsers.includes(participant._id?.toString?.());

  // ── Real-time ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) return undefined;

    socketService.connect(token);

    if (selectedId) {
      socketService.joinChat(selectedId);
    }

    const applyIncoming = (message) => {
      if (!message || !message.conversation) return;
      const incoming = message.sender?.toString?.() !== currentUserId?.toString?.();
      if (message.conversation === selectedId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
      loadConversations();
      if (incoming) dispatch(fetchUnreadCount());
    };

    const onMessageRead = () => {
      loadConversations();
      dispatch(fetchUnreadCount());
    };

    socketService.onGlobal('new-message', applyIncoming);
    socketService.onGlobal('message-received', applyIncoming);
    socketService.onGlobal('message-read', onMessageRead);

    return () => {
      if (selectedId) socketService.leaveChat(selectedId);
      socketService.offGlobal('new-message', applyIncoming);
      socketService.offGlobal('message-received', applyIncoming);
      socketService.offGlobal('message-read', onMessageRead);
    };
  }, [selectedId, currentUserId, loadConversations, dispatch, scrollToBottom]);

  // ── Composer ──
  const handleSend = async () => {
    const text = input.trim();
    if (sending || (!text && !pendingFile)) return;
    if (!selectedConversation || !selectedParticipant) return;

    setSending(true);
    try {
      const res = await sendMessage({
        conversationId: selectedConversation._id,
        recipientId: selectedParticipant._id,
        content: text || '',
        type: pendingFile?.type || 'text',
        fileUrl: pendingFile?.fileUrl,
        fileName: pendingFile?.fileName,
      });
      setMessages((prev) => [...prev, res.data?.data?.message]);
      setInput('');
      setPendingFile(null);
      await loadConversations();
      scrollToBottom();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_MIME.includes(file.type) && !ACCEPTED_EXT.includes(ext)) {
      toast.error('Unsupported file format. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    uploadAttachment(file)
      .then((res) => {
        setPendingFile(res.data?.data || { fileUrl: URL.createObjectURL(file), fileName: file.name, type: file.type?.startsWith('image/') ? 'image' : 'file' });
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'File upload failed.');
      })
      .finally(() => setUploading(false));
  };

  const addEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
    setEmojiOpen(false);
  };

  // ── Conversation actions ──
  const handleMarkRead = async () => {
    if (!selectedId) return;
    try {
      await markConversationRead(selectedId);
      await loadConversations();
      dispatch(fetchUnreadCount());
      setMenuOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark as read.');
    }
  };

  const handleMarkUnread = async () => {
    if (!selectedId) return;
    try {
      await markConversationUnread(selectedId);
      await loadConversations();
      dispatch(fetchUnreadCount());
      setMenuOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark as unread.');
    }
  };

  const handleArchive = async () => {
    if (!selectedId) return;
    try {
      await toggleArchiveConversation(selectedId);
      setMenuOpen(false);
      toast.success('Conversation archived.');
      handleBackToList();
      await loadConversations();
      dispatch(fetchUnreadCount());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not archive conversation.');
    }
  };

  // ── Message actions (Edit / Delete) ──
  const closeActionMenu = useCallback(() => {
    setActionMenuVisible(false);
    setActionMenuMessage(null);
  }, []);

  const handleOpenActionMenu = (event, message) => {
    if (editMessageId) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const top = rect.bottom + 6;
    const left = Math.max(12, rect.right - 184);
    setActionMenuVisible(true);
    setActionMenuMessage(message);
    setActionMenuPosition({ top, left });
  };

  const handleEditMessage = (message) => {
    setEditMessageId(message._id);
    setEditMessageText(message.content || '');
    closeActionMenu();
  };

  const handleCancelEdit = useCallback(() => {
    setEditMessageId(null);
    setEditMessageText('');
  }, []);

  const handleSaveEditedMessage = async () => {
    if (!editMessageText.trim()) {
      toast.error(t('admin.messages.editEmpty') || 'Message cannot be empty.');
      return;
    }
    try {
      const res = await updateMessage(editMessageId, editMessageText.trim());
      setMessages((prev) => prev.map((msg) => (msg._id === editMessageId ? res.data?.data : msg)));
      setEditMessageId(null);
      setEditMessageText('');
      toast.success(t('admin.messages.editSuccess') || 'Message updated.');
      await loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Message could not be updated.');
    }
  };

  const handleRequestDelete = (message) => {
    closeActionMenu();
    setDeleteConfirmMessage(message);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmMessage) return;
    setDeleteSaving(true);
    try {
      await deleteMessage(deleteConfirmMessage._id);
      setMessages((prev) => prev.filter((msg) => msg._id !== deleteConfirmMessage._id));
      setDeleteConfirmMessage(null);
      toast.success(t('admin.messages.deleteSuccess') || 'Message deleted.');
      await loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Message could not be deleted.');
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleteSaving) return;
    setDeleteConfirmMessage(null);
  };

  // Close the message action menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (actionMenuVisible && actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        closeActionMenu();
      }
    };
    if (actionMenuVisible) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
    return undefined;
  }, [actionMenuVisible, closeActionMenu]);

  // Escape: cancel edit, then close the action menu
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      if (editMessageId) {
        handleCancelEdit();
      } else if (actionMenuVisible) {
        closeActionMenu();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMessageId, actionMenuVisible, handleCancelEdit, closeActionMenu]);

  // Focus + place cursor at the end of the textarea when editing starts
  useEffect(() => {
    if (editMessageId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const length = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }, [editMessageId]);

  // ── Recipient search ──
  useEffect(() => {
    if (!newMessageOpen) return;
    setRecipientsLoading(true);
    const timer = setTimeout(() => {
      searchRecipients({ q: recipientQuery, role: recipientRole === 'all' ? '' : recipientRole })
        .then((res) => setRecipients(res.data?.data || []))
        .catch(() => setRecipients([]))
        .finally(() => setRecipientsLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [newMessageOpen, recipientQuery, recipientRole]);

  const handleStartConversation = async () => {
    if (!selectedRecipient || !newMessageText.trim()) return;
    setSending(true);
    try {
      const res = await sendMessage({
        recipientId: selectedRecipient._id,
        content: newMessageText.trim(),
        type: 'text',
      });
      await loadConversations();
      const created = res.data?.data?.conversation;
      setNewMessageOpen(false);
      setSelectedRecipient(null);
      setNewMessageText('');
      setRecipientQuery('');
      if (created?._id) {
        setSelectedId(created._id);
        navigate(`/admin/messages?conversationId=${created._id}`, { replace: true });
        setMessages([res.data?.data?.message]);
        dispatch(fetchUnreadCount());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation.');
    } finally {
      setSending(false);
    }
  };

  // Close the header menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
    return undefined;
  }, [menuOpen]);

  // ── Derived lists ──
  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filter === 'unread') {
      list = list.filter((c) => getUnread(c, currentUserId) > 0);
    } else if (filter === 'employers' || filter === 'jobseekers' || filter === 'support') {
      const targetRole = filter === 'employers' ? 'employer' : filter === 'jobseekers' ? 'jobseeker' : 'admin';
      list = list.filter((c) =>
        c.participants?.some((p) => p._id !== currentUserId && p.role === targetRole)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const participant = c.participants?.find((p) => p._id !== currentUserId);
        const name = `${participant?.firstName || ''} ${participant?.lastName || ''}`.toLowerCase();
        const email = (participant?.email || '').toLowerCase();
        const company = (participant?.company?.name || '').toLowerCase();
        const preview = (c.lastMessage?.content || '').toLowerCase();
        return name.includes(q) || email.includes(q) || company.includes(q) || preview.includes(q);
      });
    }
    return list;
  }, [conversations, filter, search, currentUserId]);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'employers', label: 'Employers' },
    { key: 'jobseekers', label: 'Job Seekers' },
    { key: 'support', label: 'Support' },
  ];

  const showChatOnMobile = !!selectedConversation;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {t('admin.messages.title') || 'Messages'}
          </h1>
          <p className="mt-1 max-w-2xl text-gray-500 dark:text-gray-400">
            {t('admin.messages.subtitle') || 'Communicate directly with employers and support users from one central inbox.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewMessageOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1769E0]/20 transition hover:bg-[#0D5BC4] dark:bg-[#1769E0] dark:hover:bg-[#0D5BC4]"
        >
          <FiPlus className="h-4 w-4" />
          {t('admin.messages.newMessage') || 'New Message'}
        </button>
      </div>

      {/* ── Inbox ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── LEFT: conversation list ── */}
        <div className={`flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${showChatOnMobile ? 'hidden lg:flex' : 'flex'}`}>
          {/* search */}
          <div className="border-b border-gray-100 p-4 dark:border-gray-700">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.messages.searchPlaceholder') || 'Search conversations...'}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* filters */}
          <div className="flex flex-wrap gap-2 px-4 pt-4">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.key
                    ? 'bg-[#1769E0] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-[#EAF2FE] hover:text-[#1769E0] dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* list */}
          <div className="mt-3 flex-1 overflow-y-auto pb-2" style={{ maxHeight: 'calc(100vh - 360px)' }}>
            {conversationsError ? (
              <div className="m-4 rounded-2xl bg-red-50 p-4 text-center dark:bg-red-900/20">
                <FiAlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{conversationsError}</p>
                <button
                  type="button"
                  onClick={loadConversations}
                  className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : conversationsLoading ? (
              <div className="space-y-1">
                {[1, 2, 3, 4, 5].map((i) => <ConversationSkeleton key={i} />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                  <FiInbox className="h-8 w-8 text-emerald-500" />
                </span>
                <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{t('admin.messages.emptyTitle') || 'Your inbox is empty'}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.messages.emptySubtitle') || 'Messages from employers, job seekers, and support users will appear here.'}
                </p>
                <button
                  type="button"
                  onClick={() => setNewMessageOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D5BC4]"
                >
                  <FiPlus className="h-4 w-4" /> {t('admin.messages.newMessage') || 'New Message'}
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <FiSearch className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.messages.noMatch') || 'No conversations match your search or filter.'}</p>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {filteredConversations.map((conversation) => {
                  const participant = getOtherParticipant(conversation, currentUserId);
                  const unread = getUnread(conversation, currentUserId);
                  const isActive = selectedId === conversation._id;
                  const roleMeta = getParticipantRoleMeta(participant);
                  const avatarMeta = getParticipantAvatarMeta(participant);
                  const name = getParticipantName(participant);
                  const lastMessage = conversation.lastMessage;
                  const preview = lastMessage && !lastMessage.isDeleted
                    ? lastMessage.content || (lastMessage.fileName ? `📎 ${lastMessage.fileName}` : 'No messages yet')
                    : 'No messages yet';

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      className={`group relative flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        isActive
                          ? 'bg-[#EAF2FE] dark:bg-emerald-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${avatarMeta}`}>
                          {participant?.avatar ? (
                            <img src={participant.avatar} alt={name} className="h-full w-full object-cover" />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                        {isParticipantOnline(participant) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-800" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-gray-900 dark:text-white">{name}</span>
                          <span className={`flex-shrink-0 text-[11px] ${unread > 0 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {formatTime(conversation.lastMessageAt || conversation.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${roleMeta.cls}`}>
                            {roleMeta.label}
                          </span>
                          {participant?.company?.name && (
                            <span className="truncate text-[11px] text-gray-400">{participant.company.name}</span>
                          )}
                        </div>
                        <p className={`mt-1 truncate text-xs ${unread > 0 ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {preview}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="mt-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: chat window ── */}
        <div className={`flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${showChatOnMobile ? 'flex' : 'hidden lg:flex'}`} style={{ minHeight: '560px' }}>
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                <FiMessageCircle className="h-10 w-10 text-emerald-500" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
                {t('admin.messages.selectTitle') || 'Select a conversation'}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {t('admin.messages.selectSubtitle') || 'Choose a conversation from the list or start a new message to communicate with employers and job seekers.'}
              </p>
            </div>
          ) : (
            <>
              {/* chat header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-900"
                >
                  <FiArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="relative flex-shrink-0">
                  <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${getParticipantAvatarMeta(selectedParticipant)}`}>
                    {selectedParticipant?.avatar ? (
                      <img src={selectedParticipant.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(getParticipantName(selectedParticipant))
                    )}
                  </div>
                  {isParticipantOnline(selectedParticipant) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-800" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-bold text-gray-900 dark:text-white">
                      {getParticipantName(selectedParticipant)}
                    </h2>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      {isParticipantOnline(selectedParticipant) ? '● Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getParticipantRoleMeta(selectedParticipant).cls}`}>
                      {getParticipantRoleMeta(selectedParticipant).label}
                    </span>
                    {selectedParticipant?.company?.name && (
                      <span className="truncate">{selectedParticipant.company.name}</span>
                    )}
                    <span className="hidden truncate sm:inline">{selectedParticipant?.email}</span>
                  </div>
                </div>

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-900"
                    aria-label="Conversation options"
                  >
                    <FiMoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-11 z-30 w-48 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                      <button type="button" onClick={handleMarkRead} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                        <FiCheckCircle className="h-4 w-4 text-emerald-600" /> Mark as read
                      </button>
                      <button type="button" onClick={handleMarkUnread} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                        <FiClock className="h-4 w-4 text-amber-600" /> Mark as unread
                      </button>
                      <button type="button" onClick={handleArchive} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                        <FiArchive className="h-4 w-4 text-violet-600" /> Archive
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* messages area */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/70 px-4 py-5 dark:bg-gray-900/40" style={{ maxHeight: 'calc(100vh - 460px)' }}>
                {messagesError ? (
                  <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-red-50 p-5 text-center dark:bg-red-900/20">
                    <FiAlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{messagesError}</p>
                    <button
                      type="button"
                      onClick={() => loadMessages(selectedId)}
                      className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : messagesLoading ? (
                  <MessageSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <FiMail className="h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin.messages.noMessagesYet') || 'No messages yet. Send the first message!'}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const senderId = message.sender?._id?.toString?.() || message.sender?.toString?.();
                    const isMine = senderId === currentUserId?.toString();
                    const isImage = isFileImage(message);
                    const isEditing = editMessageId === message._id;
                    return (
                      <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          onClick={(e) => isMine && !isEditing && handleOpenActionMenu(e, message)}
                          onContextMenu={(e) => isMine && !isEditing && handleOpenActionMenu(e, message)}
                          className={`max-w-[80%] overflow-hidden shadow-sm sm:max-w-[70%] ${
                            isMine
                              ? 'cursor-pointer rounded-2xl rounded-br-md bg-emerald-600 text-white'
                              : 'rounded-2xl rounded-bl-md border border-gray-100 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2 p-3" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                ref={editTextareaRef}
                                value={editMessageText}
                                onChange={(e) => setEditMessageText(e.target.value)}
                                rows={3}
                                placeholder={t('admin.messages.editPlaceholder') || 'Edit message...'}
                                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                                  className="rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                                >
                                  {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSaveEditedMessage(); }}
                                  className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#1769E0] transition hover:bg-[#DCEAFD]"
                                >
                                  {t('common.save') || 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {isImage && message.fileUrl ? (
                                <a href={message.fileUrl} target="_blank" rel="noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
                                  <img src={message.fileUrl} alt={message.fileName || 'attachment'} className="max-h-56 w-full object-cover" />
                                </a>
                              ) : message.fileUrl ? (
                                <a
                                  href={message.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`flex items-center gap-3 px-4 py-3 ${isMine ? 'bg-[#1769E0]/40' : 'bg-gray-50 dark:bg-gray-900'}`}
                                >
                                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isMine ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <FiFile className="h-5 w-5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{message.fileName || 'Attachment'}</p>
                                    <p className={`flex items-center gap-1 text-xs ${isMine ? 'text-emerald-100' : 'text-gray-500'}`}>
                                      <FiDownload className="h-3 w-3" /> Download
                                    </p>
                                  </div>
                                </a>
                              ) : null}

                              {message.content && (
                                <p className="whitespace-pre-wrap break-words px-4 py-2.5 text-sm">{message.content}</p>
                              )}

                              <div className={`flex items-center justify-end gap-2 px-4 pb-2 ${message.fileUrl && !message.content ? 'pt-0' : ''}`}>
                                {message.updatedAt && message.updatedAt !== message.createdAt && (
                                  <span className={`text-[11px] ${isMine ? 'text-emerald-100/80' : 'text-gray-400'}`}>
                                    {t('messages.edited') || 'edited'}
                                  </span>
                                )}
                                <span className={`text-[11px] ${isMine ? 'text-emerald-100/90' : 'text-gray-400'}`}>
                                  {formatFullTime(message.createdAt || message.updatedAt)}
                                </span>
                                {isMine && message.isRead === true && (
                                  <FiCheck className={`h-3.5 w-3.5 ${isMine ? 'text-white' : 'text-emerald-600'}`} />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* contextual menu for own messages */}
              {actionMenuVisible && actionMenuMessage && (
                <div
                  ref={actionMenuRef}
                  style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                  className="fixed z-50 w-48 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900"
                >
                  <button
                    type="button"
                    onClick={() => handleEditMessage(actionMenuMessage)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <FiEdit2 className="h-4 w-4 text-emerald-600" />
                    {t('common.edit') || 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(actionMenuMessage)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <FiTrash2 className="h-4 w-4 text-red-500" />
                    {t('common.delete') || 'Delete'}
                  </button>
                </div>
              )}

              {/* composer */}
              <div className="border-t border-gray-100 p-4 dark:border-gray-700">
                {pendingFile && (
                  <div className="mb-3 flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-gray-900">
                    {pendingFile.type === 'image' ? (
                      <img src={pendingFile.fileUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <FiFile className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{pendingFile.fileName}</p>
                      <p className="text-xs text-gray-400">Ready to send</p>
                    </div>
                    <button type="button" onClick={() => setPendingFile(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      rows={1}
                      placeholder={t('admin.messages.typePlaceholder') || 'Type a message...'}
                      className="max-h-32 min-h-[46px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <div className="absolute bottom-2 right-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEmojiOpen((o) => !o)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-[#1769E0] dark:hover:bg-gray-800"
                          aria-label="Add emoji"
                        >
                          <FiSmile className="h-4.5 w-4.5" />
                        </button>
                        {emojiOpen && (
                          <div className="absolute bottom-10 right-0 z-30 grid w-56 grid-cols-8 gap-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                            {EMOJIS.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => addEmoji(e)}
                                className="rounded-lg p-1 text-lg transition hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePickFile} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-[#1769E0] hover:text-[#1769E0] disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                    aria-label="Attach file"
                  >
                    {uploading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiPaperclip className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !selectedParticipant || (!input.trim() && !pendingFile)}
                    className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/25 transition hover:bg-[#0D5BC4] disabled:cursor-not-allowed disabled:bg-[#A8C8F5] dark:bg-[#1769E0] dark:hover:bg-[#1769E0]"
                    aria-label="Send message"
                  >
                    {sending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  {t('admin.messages.enterHint') || 'Press Enter to send, Shift + Enter for a new line'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── New Message modal ── */}
      {newMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('admin.messages.newMessage') || 'New Message'}</h2>
                <p className="text-sm text-gray-500">{t('admin.messages.newMessageSubtitle') || 'Find an employer, job seeker, or support user to message.'}</p>
              </div>
              <button
                type="button"
                onClick={() => setNewMessageOpen(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                placeholder="Search by name, company, or email..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'employer', label: 'Employers' },
                { key: 'jobseeker', label: 'Job Seekers' },
                { key: 'admin', label: 'Support' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRecipientRole(r.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    recipientRole === r.key
                      ? 'bg-[#1769E0] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-[#EAF2FE] dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-700">
              {recipientsLoading ? (
                <div className="space-y-1 p-2">
                  {[1, 2, 3].map((i) => <ConversationSkeleton key={i} />)}
                </div>
              ) : recipients.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">{t('admin.messages.noRecipients') || 'No users found.'}</p>
              ) : (
                recipients.map((r) => {
                  const name = `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown';
                  const roleMeta = ROLE_STYLE[r.role] || ROLE_STYLE.jobseeker;
                  const avatarMeta = ROLE_AVATAR[r.role] || ROLE_AVATAR.jobseeker;
                  const active = selectedRecipient?._id === r._id;
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => setSelectedRecipient(active ? null : r)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        active ? 'bg-[#EAF2FE] dark:bg-emerald-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${avatarMeta}`}>
                        {r.avatar ? <img src={r.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${roleMeta.cls}`}>{roleMeta.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="truncate">{r.email}</span>
                          {r.company?.name && <span className="truncate">• {r.company.name}</span>}
                        </div>
                      </div>
                      {active && <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />}
                    </button>
                  );
                })
              )}
            </div>

            {selectedRecipient && (
              <div className="mt-4">
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={3}
                  placeholder={`Message ${`${selectedRecipient.firstName || ''} ${selectedRecipient.lastName || ''}`.trim()}...`}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMessageOpen(false)}
                    className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartConversation}
                    disabled={sending || !newMessageText.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D5BC4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
                    {t('admin.messages.sendMessage') || 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete message confirmation modal ── */}
      {deleteConfirmMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30">
                <FiTrash2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('admin.messages.deleteTitle') || 'Delete this message?'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.messages.deleteBody') || 'This will permanently remove the message from the conversation. This action cannot be undone.'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleteSaving}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSaving}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/25 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteSaving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
