import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiInbox,
  FiInfo,
  FiBriefcase,
  FiFileText,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiMail,
  FiAlertTriangle,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '../../../store/slices/notificationSlice';

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

const TABS = [
  { key: 'all', label: 'all', isRead: undefined },
  { key: 'unread', label: 'unread', isRead: false },
  { key: 'read', label: 'read', isRead: true },
];

const AdminNotifications = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading, error, pagination } = useSelector((state) => state.notifications);

  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);
  const [loadError, setLoadError] = useState('');

  const LIMIT = 12;

  const loadNotifications = useCallback(
    async (tabKey, pageNumber) => {
      setLoadError('');
      const tab = TABS.find((x) => x.key === tabKey);
      try {
        await dispatch(
          fetchNotifications({
            page: pageNumber,
            limit: LIMIT,
            ...(tab.isRead === undefined ? {} : { isRead: tab.isRead }),
          })
        ).unwrap();
      } catch (err) {
        setLoadError(err || 'Unable to load notifications.');
      }
    },
    [dispatch]
  );

  useEffect(() => {
    setPage(1);
    loadNotifications(activeTab, 1);
  }, [activeTab, loadNotifications]);

  const switchTab = (tabKey) => {
    if (tabKey === activeTab) return;
    setActiveTab(tabKey);
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success(t('admin.notifications.markedAllRead', { defaultValue: 'All notifications marked as read.' }));
      loadNotifications(activeTab, 1);
    } catch (err) {
      toast.error(err || t('admin.notifications.markAllFailed', { defaultValue: 'Unable to mark all notifications as read.' }));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await dispatch(markAsRead(notification._id)).unwrap();
      } catch (err) {
        toast.error(err || t('admin.notifications.markReadFailed', { defaultValue: 'Unable to mark notification as read.' }));
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(activeTab, nextPage);
  };

  const retry = () => {
    setLoadError('');
    loadNotifications(activeTab, 1);
  };

  const isEmpty = !loading && notifications.length === 0;

  const emptyCopy = () => {
    if (activeTab === 'unread') {
      return {
        title: t('admin.notifications.emptyUnread', { defaultValue: 'No unread notifications' }),
        message: t('admin.notifications.allCaughtUp', { defaultValue: "You're all caught up." }),
      };
    }
    if (activeTab === 'read') {
      return {
        title: t('admin.notifications.emptyRead', { defaultValue: 'No read notifications' }),
        message: t('admin.notifications.emptyReadMessage', { defaultValue: 'Notifications you open will appear here.' }),
      };
    }
    return {
      title: t('admin.notifications.noNotifications', { defaultValue: 'No notifications' }),
      message: t('admin.notifications.allCaughtUp', { defaultValue: "You're all caught up." }),
    };
  };

  const emptyState = emptyCopy();

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('admin.notifications.title', { defaultValue: 'Notifications' })}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('admin.notifications.subtitle', { defaultValue: 'Stay up to date with everything happening on the platform.' })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markingAll}
          className="btn btn-secondary shrink-0"
        >
          <FiCheckCircle className="mr-2 h-4 w-4" />
          {markingAll
            ? t('admin.notifications.markingAllRead', { defaultValue: 'Marking...' })
            : t('admin.notifications.markAllAsRead', { defaultValue: 'Mark all as read' })}
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            aria-pressed={activeTab === tab.key}
          >
            {t(`admin.notifications.${tab.label}`, { defaultValue: tab.label })}
          </button>
        ))}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      {loading && notifications.length === 0 ? (
        <div className="card flex items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-600" />
          {t('admin.notifications.loading', { defaultValue: 'Loading notifications...' })}
        </div>
      ) : (error || loadError) && notifications.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <FiAlertTriangle className="h-10 w-10 text-amber-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('admin.notifications.loadFailed', { defaultValue: 'Unable to load notifications.' })}
          </p>
          <button type="button" onClick={retry} className="btn btn-secondary">
            <FiRefreshCw className="mr-2 h-4 w-4" />
            {t('admin.notifications.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : isEmpty ? (
        <div className="card flex flex-col items-center justify-center gap-2 py-16 text-center">
          <FiInbox className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{emptyState.title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyState.message}</p>
        </div>
      ) : (
        <div className="card p-0">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => {
              const meta = getNotifMeta(notification.type);
              const Icon = meta.icon;
              return (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:px-5 ${
                      notification.isRead ? '' : 'bg-emerald-50/40 dark:bg-emerald-500/5'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${
                            notification.isRead
                              ? 'text-gray-600 dark:text-gray-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            {t('admin.notifications.unreadBadge', { defaultValue: 'Unread' })}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </span>
                      <span className="mt-1.5 block text-xs font-medium text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Load more */}
          {pagination?.hasNext && (
            <div className="border-t border-gray-100 p-3 text-center dark:border-gray-700">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading
                  ? t('admin.notifications.loadingMore', { defaultValue: 'Loading...' })
                  : t('admin.notifications.loadMore', { defaultValue: 'Load more' })}
              </button>
            </div>
          )}
          {!pagination?.hasNext && notifications.length > 0 && (
            <p className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
              {t('admin.notifications.noMore', { defaultValue: "You've reached the end of your notifications." })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
