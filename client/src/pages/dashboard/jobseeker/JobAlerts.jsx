import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell, FiMapPin, FiBriefcase, FiClock,
  FiCheckCircle, FiInbox, FiRefreshCw,
} from 'react-icons/fi';
import { getJobAlertNotifications, markJobAlertRead } from '../../../services/jobSearchService';
import api from '../../../services/api';

// ── Relative time helper ─────────────────────────────────────────────────────
const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) === 1 ? '' : 's'} ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`;
  if (diff < 86400 * 7)  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Single alert card ────────────────────────────────────────────────────────
const AlertCard = ({ notification, onView }) => {
  const { data = {}, isRead, createdAt } = notification;
  // All real values come from the backend data field populated at approval time
  const jobTitle    = data.jobTitle    || 'Job Posting';
  const companyName = data.companyName || '';
  const location    = data.location    || '';
  const jobType     = data.jobType     || '';

  return (
    <div
      className={`group relative rounded-3xl border p-5 transition-all hover:shadow-md ${
        isRead
          ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-900/10'
      }`}
    >
      {/* Unread dot */}
      {!isRead && (
        <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left – icon + content */}
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex-shrink-0 rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            <FiBell className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              New Job Posted
            </p>

            <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white leading-snug">
              {jobTitle}
            </h3>

            {companyName && (
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{companyName}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {location && (
                <span className="flex items-center gap-1.5">
                  <FiMapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  {location}
                </span>
              )}
              {jobType && (
                <span className="flex items-center gap-1.5">
                  <FiBriefcase className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  {jobType}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              A new job has been approved and published.
            </p>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <FiClock className="h-3.5 w-3.5" />
              {relativeTime(createdAt)}
            </div>
          </div>
        </div>

        {/* Right – View Job button */}
        <div className="flex flex-shrink-0 items-center sm:ml-4">
          <button
            type="button"
            onClick={() => onView(notification)}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            View Job
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-full max-w-xs rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  </div>
);

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-slate-50 px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
    <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
      <FiInbox className="h-8 w-8" />
    </span>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No new job alerts</h3>
    <p className="mt-3 max-w-sm text-sm text-gray-500 dark:text-gray-400">
      New job notifications will appear here when jobs are approved and published.
    </p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const JobAlerts = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetches ONLY type=new_job notifications for the current authenticated user
      // from the real database — no mock/seeded data
      const res = await getJobAlertNotifications({ sort: '-createdAt' });
      const list = res.data?.data || res.data || [];
      // Sort newest-first (defensive in case server doesn't sort)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load job alert notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark single notification read and navigate to the real job page
  const handleView = async (notification) => {
    if (!notification.isRead) {
      try {
        await markJobAlertRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
      } catch {
        // non-critical – navigate anyway
      }
    }
    // Navigate using the REAL jobId from the notification data
    const jobId = notification.data?.jobId || notification.link?.split('/').pop();
    if (jobId) {
      navigate(`/jobs/${jobId}`);
    }
  };

  // Mark ALL new_job notifications read in one request
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all', {}, { params: { type: 'new_job' } });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Job Alerts</h1>
          <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
            Get notified whenever a new job is approved and published.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unread badge */}
          {!loading && unreadCount > 0 && (
            <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              {unreadCount} new
            </span>
          )}
          {/* Refresh */}
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="rounded-full border border-gray-200 p-2.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Content card ── */}
      <section className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Section sub-header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              <FiBell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Job notifications
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically generated when a new job is approved and published.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && notifications.length > 0 && (
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            )}
            {!loading && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>
        </div>

        {/* States */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <AlertCard
                key={notification._id}
                notification={notification}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {/* All caught up footer */}
        {!loading && notifications.length > 0 && unreadCount === 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <FiCheckCircle className="h-4 w-4 text-emerald-500" />
            You&apos;re all caught up!
          </div>
        )}
      </section>
    </div>
  );
};

export default JobAlerts;
