// ============================================
// AdminHeaderActions — Notification bell + admin profile dropdown
// Fully wired to the real notification API, auth store, and socket events.
// ============================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiInbox,
  FiBriefcase,
  FiFileText,
  FiInfo,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiMail,
  FiAlertTriangle,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  fetchNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  addNotification,
  clearError,
} from '../store/slices/notificationSlice';
import { logout } from '../store/slices/authSlice';
import socketService from '../services/socket';

const NOTIF_META = {
  new_user_registration: { icon: FiUser, cls: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
  new_employer_registration: { icon: FiBriefcase, cls: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300' },
  new_company: { icon: FiBriefcase, cls: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300' },
  company_pending_approval: { icon: FiBriefcase, cls: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300' },
  company_approved: { icon: FiCheckCircle, cls: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
  company_rejected: { icon: FiXCircle, cls: 'text-rose-600 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' },
  new_job: { icon: FiFileText, cls: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
  job_pending_approval: { icon: FiFileText, cls: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300' },
  job_approved: { icon: FiCheckCircle, cls: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300' },
  job_rejected: { icon: FiXCircle, cls: 'text-rose-600 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' },
  job_reported: { icon: FiAlertTriangle, cls: 'text-rose-600 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' },
  application_submitted: { icon: FiFileText, cls: 'text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300' },
  application_reviewed: { icon: FiFileText, cls: 'text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300' },
  application_shortlisted: { icon: FiFileText, cls: 'text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300' },
  interview_scheduled: { icon: FiCalendar, cls: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
  interview_reminder: { icon: FiCalendar, cls: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
  new_message: { icon: FiMail, cls: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300' },
  system: { icon: FiInfo, cls: 'text-gray-600 bg-gray-100 dark:bg-gray-500/15 dark:text-gray-300' },
};

const getNotifMeta = (type) => NOTIF_META[type] || { icon: FiInfo, cls: 'text-gray-600 bg-gray-100 dark:bg-gray-500/15 dark:text-gray-300' };

const getInitials = (user) =>
  `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'AU';

const AdminHeaderActions = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, loading, loadingUnread, error } = useSelector((state) => state.notifications);

  const [openMenu, setOpenMenu] = useState(null); // 'bell' | 'avatar' | null
  const [markingAll, setMarkingAll] = useState(false);
  const [notifError, setNotifError] = useState('');
  const wrapperRef = useRef(null);
  const bellWrapRef = useRef(null);
  const bellDropdownRef = useRef(null);
  const avatarWrapRef = useRef(null);
  const avatarDropdownRef = useRef(null);
  const [bellPos, setBellPos] = useState(null);
  const [avatarPos, setAvatarPos] = useState(null);

  const getAnchorPos = (el) => {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { top: rect.bottom, right: window.innerWidth - rect.right };
  };

  const isAdmin = user?.role === 'admin';

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return undefined;
    dispatch(getUnreadCount());
    dispatch(fetchNotifications({ limit: 8 }));
    return undefined;
  }, [dispatch, isAdmin]);

  // ── Socket: realtime notifications ──────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return undefined;

    const handleNewNotification = (notification) => {
      if (!notification) return;
      dispatch(addNotification(notification));
      dispatch(getUnreadCount());
    };

    // Ensure the socket exists before registering the global listener
    // (child effects run before the parent DashboardLayout connects it).
    const token = localStorage.getItem('token');
    if (token && !socketService.socket?.connected) {
      socketService.connect(token);
    }

    socketService.onGlobal('notification', handleNewNotification);
    return () => socketService.offGlobal('notification', handleNewNotification);
  }, [dispatch, isAdmin]);

  // ── Safe polling fallback (keeps the count accurate without refresh) ────
  useEffect(() => {
    if (!isAdmin) return undefined;
    const poll = setInterval(() => {
      dispatch(getUnreadCount());
      if (openMenu === 'bell') {
        dispatch(fetchNotifications({ limit: 8 }));
      }
    }, 60000);
    return () => clearInterval(poll);
  }, [dispatch, isAdmin, openMenu]);

  // ── Close dropdowns on navigation ───────────────────────────────────────
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  // ── Outside click / Escape ──────────────────────────────────────────────
  useEffect(() => {
    const handlePointerDown = (event) => {
      const insideWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
      const insideBellDropdown = bellDropdownRef.current && bellDropdownRef.current.contains(event.target);
      const insideAvatarDropdown = avatarDropdownRef.current && avatarDropdownRef.current.contains(event.target);
      if (!insideWrapper && !insideBellDropdown && !insideAvatarDropdown) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (openMenu === null) return undefined;
    const handleResize = () => {
      if (openMenu === 'bell') setBellPos(getAnchorPos(bellWrapRef.current));
      if (openMenu === 'avatar') setAvatarPos(getAnchorPos(avatarWrapRef.current));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [openMenu]);

  const toggleMenu = (menu) => {
    const isOpening = openMenu !== menu;
    setOpenMenu((prev) => (prev === menu ? null : menu));
    if (menu === 'bell') {
      if (isOpening) setBellPos(getAnchorPos(bellWrapRef.current));
      setNotifError('');
      dispatch(clearError());
      dispatch(fetchNotifications({ limit: 8 }));
    } else if (menu === 'avatar' && isOpening) {
      setAvatarPos(getAnchorPos(avatarWrapRef.current));
    }
  };

  const closeMenu = () => setOpenMenu(null);

  // ── Notification interactions ───────────────────────────────────────────
  const handleNotificationClick = useCallback(
    async (notification) => {
      if (!notification.isRead) {
        try {
          await dispatch(markAsRead(notification._id)).unwrap();
        } catch (err) {
          toast.error(err || t('admin.header.notificationReadFailed', { defaultValue: 'Unable to mark notification as read.' }));
        }
      }
      if (notification.link) {
        navigate(notification.link);
      }
    },
    [dispatch, navigate, t]
  );

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success(t('admin.header.markedAllRead', { defaultValue: 'All notifications marked as read.' }));
    } catch (err) {
      toast.error(err || t('admin.header.markAllFailed', { defaultValue: 'Unable to mark all notifications as read.' }));
    } finally {
      setMarkingAll(false);
    }
  };

  const retryNotifications = () => {
    setNotifError('');
    dispatch(clearError());
    dispatch(fetchNotifications({ limit: 8 }));
    dispatch(getUnreadCount());
  };

  // ── Auth actions ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    closeMenu();
    try {
      await dispatch(logout()).unwrap();
    } catch {
      // Even if the API call fails, local auth state is cleared by the slice.
    }
    navigate('/login');
  };

  const profileName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('admin.header.adminUser', { defaultValue: 'Admin User' });
  const profileEmail = user?.email || '';
  const initials = getInitials(user);

  const notificationsLoading = loading || (loadingUnread && notifications.length === 0);
  const visibleError = error || notifError;

  return (
    <>
    <div ref={wrapperRef} className="flex items-center gap-3">
      {/* ── Notification Bell ──────────────────────────────────────────── */}
      <div className="relative" ref={bellWrapRef}>
        <button
          type="button"
          onClick={() => toggleMenu('bell')}
          aria-label={t('admin.header.notifications', { defaultValue: 'Notifications' })}
          aria-haspopup="true"
          aria-expanded={openMenu === 'bell'}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-[#1769E0] hover:text-[#1769E0] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <FiBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {openMenu === 'bell' && bellPos &&
        createPortal(
          <div
            ref={bellDropdownRef}
            className="fixed z-[9999] w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            style={{ top: bellPos.top + 10, right: bellPos.right }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('admin.header.notifications', { defaultValue: 'Notifications' })}
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FE] px-2.5 py-1 text-xs font-semibold text-[#1769E0] transition hover:bg-[#DCEAFD] disabled:opacity-50 dark:bg-[#1769E0]/10 dark:text-emerald-300 dark:hover:bg-[#0D5BC4]/20"
                >
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  {markingAll
                    ? t('admin.header.markingAllRead', { defaultValue: 'Marking...' })
                    : t('admin.header.markAllAsRead', { defaultValue: 'Mark all as read' })}
                </button>
              )}
            </div>

            {/* Body */}
            {notificationsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-gray-500 dark:text-gray-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-600" />
                <p className="text-sm">{t('admin.header.loadingNotifications', { defaultValue: 'Loading notifications...' })}</p>
              </div>
            ) : visibleError ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <FiAlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('admin.header.loadNotificationsFailed', { defaultValue: 'Unable to load notifications.' })}
                </p>
                <button
                  type="button"
                  onClick={retryNotifications}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                  {t('admin.header.retry', { defaultValue: 'Retry' })}
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <FiInbox className="h-9 w-9 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('admin.header.noNotifications', { defaultValue: 'No notifications' })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('admin.header.allCaughtUp', { defaultValue: "You're all caught up." })}
                </p>
              </div>
            ) : (
              <ul className="max-h-[22rem] overflow-y-auto sidebar-scroll">
                {notifications.map((notification) => {
                  const meta = getNotifMeta(notification.type);
                  const Icon = meta.icon;
                  return (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={`truncate text-sm font-semibold ${
                                notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {notification.title}
                            </span>
                            {!notification.isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label={t('admin.notifications.unreadBadge', { defaultValue: 'Unread' })} />
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 p-2 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate('/admin/notifications');
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#1769E0] transition hover:bg-[#EAF2FE] dark:text-emerald-300 dark:hover:bg-[#0D5BC4]/10"
              >
                {t('admin.header.viewAllNotifications', { defaultValue: 'View all notifications' })}
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ── Admin Avatar ────────────────────────────────────────────────── */}
      <div className="relative" ref={avatarWrapRef}>
        <button
          type="button"
          onClick={() => toggleMenu('avatar')}
          aria-label={t('admin.header.adminProfileMenu', { defaultValue: 'Admin profile menu' })}
          aria-haspopup="true"
          aria-expanded={openMenu === 'avatar'}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-[#1769E0] text-sm font-bold text-white shadow-sm transition hover:ring-2 hover:ring-emerald-200 dark:border-gray-700"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={profileName} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </button>
      </div>

      {openMenu === 'avatar' && avatarPos &&
        createPortal(
          <div
            ref={avatarDropdownRef}
            className="fixed z-[9999] w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            style={{ top: avatarPos.top + 10, right: avatarPos.right }}
          >
            <div className="border-b border-gray-100 px-4 py-3.5 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={profileName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{profileName}</span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{profileEmail}</span>
                </span>
              </div>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate('/admin/profile');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FiUser className="h-4 w-4 text-gray-400" />
                {t('admin.header.viewProfile', { defaultValue: 'View Profile' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate('/admin/settings');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FiSettings className="h-4 w-4 text-gray-400" />
                {t('admin.header.accountSettings', { defaultValue: 'Account Settings' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate('/admin/settings#notifications');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FiBell className="h-4 w-4 text-gray-400" />
                {t('admin.header.notificationSettings', { defaultValue: 'Notification Settings' })}
              </button>

              <div className="my-1.5 border-t border-gray-100 dark:border-gray-700" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <FiLogOut className="h-4 w-4" />
                {t('admin.header.logout', { defaultValue: 'Logout' })}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
    </>
  );
};

export default AdminHeaderActions;
