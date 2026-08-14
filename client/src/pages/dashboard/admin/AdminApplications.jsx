import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiInbox,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const PAGE_SIZE = 10;

// Status buckets shown as filters + statistics cards.
const STATUS_FILTERS = ['all', 'Pending', 'Under Review', 'Interview', 'Hired', 'Rejected'];

// Full set of statuses defined by the Application model so an existing row's
// status (e.g. "Interview Scheduled" or "withdrawn") always matches an option.
const STATUS_CHANGE_OPTIONS = [
  'Submitted',
  'Reviewed',
  'Shortlisted',
  'Interview',
  'Interview Scheduled',
  'Interview Completed',
  'Interview Cancelled',
  'Rejected',
  'Not Selected',
  'Selected',
  'Hired',
  'withdrawn',
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'Submitted':
      return 'bg-[#FEF3C7] text-[#92400E] ring-[#FEF3C7]';
    case 'Reviewed':
    case 'Shortlisted':
      return 'bg-[#E0F2FE] text-[#0C4A6E] ring-[#E0F2FE]';
    case 'Interview':
    case 'Interview Scheduled':
    case 'Interview Completed':
      return 'bg-[#EDE9FE] text-[#5B21B6] ring-[#EDE9FE]';
    case 'Selected':
    case 'Hired':
    case 'accepted':
      return 'bg-[#DCF2E8] text-[#065F46] ring-[#DCF2E8]';
    case 'Rejected':
    case 'Not Selected':
      return 'bg-[#FEE2E2] text-[#B91C1C] ring-[#FEE2E2]';
    default:
      return 'bg-[#F1F5F9] text-[#4B5563] ring-[#F1F5F9]';
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
};

const getFileName = (url) => {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    const segments = path.split('/').filter(Boolean);
    return segments.length ? decodeURIComponent(segments.at(-1)) : url;
  } catch {
    return url;
  }
};

const renderDetail = (value, fallback = 'Not provided') => {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-100">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 rounded bg-gray-200" style={{ width: i < 2 ? '80%' : '60%' }} />
      </td>
    ))}
  </tr>
);

const AdminApplications = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, underReview: 0, interview: 0, hired: 0, rejected: 0 });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState(null); // details modal
  const [deleteTarget, setDeleteTarget] = useState(null); // delete confirm modal
  const [changingId, setChangingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/applications', {
        params: {
          page,
          limit: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search.trim() || undefined,
        },
      });
      setData(res.data?.data || []);
      setStats(res.data?.stats || {});
      setPagination(res.data?.pagination || {});
    } catch (err) {
      setError(t('admin.applications.loadFailed') || 'Failed to load applications.');
      toast.error(err?.response?.data?.message || err?.message || (t('admin.applications.loadFailed') || 'Failed to load applications.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, t]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications, page, statusFilter]);

  const statCards = useMemo(() => [
    { key: 'total', label: t('admin.applications.total') || 'Total Applications', value: stats.total, color: 'bg-emerald-50 text-emerald-600', icon: <FiFileText className="h-5 w-5" /> },
    { key: 'Pending', label: t('admin.applications.pending') || 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-600', icon: <FiClock className="h-5 w-5" /> },
    { key: 'Under Review', label: t('admin.applications.underReview') || 'Under Review', value: stats.underReview, color: 'bg-sky-50 text-sky-600', icon: <FiEye className="h-5 w-5" /> },
    { key: 'Interview', label: t('admin.applications.interview') || 'Interview', value: stats.interview, color: 'bg-indigo-50 text-indigo-600', icon: <FiCalendar className="h-5 w-5" /> },
    { key: 'Hired', label: t('admin.applications.hired') || 'Hired', value: stats.hired, color: 'bg-emerald-50 text-emerald-600', icon: <FiCheckCircle className="h-5 w-5" /> },
    { key: 'Rejected', label: t('admin.applications.rejected') || 'Rejected', value: stats.rejected, color: 'bg-rose-50 text-rose-600', icon: <FiTrash2 className="h-5 w-5" /> },
  ], [stats, t]);

  const handleStatusChange = async (appId, value) => {
    setChangingId(appId);
    try {
      await api.put(`/applications/${appId}/status`, { status: value });
      toast.success(t('admin.applications.statusSuccess') || 'Application status updated.');
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || (t('admin.applications.statusFailed') || 'Unable to update status.'));
    } finally {
      setChangingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    try {
      await api.delete(`/admin/applications/${deleteTarget._id}`);
      toast.success(t('admin.applications.deleteSuccess') || 'Application deleted.');
      setDeleteTarget(null);
      // If this was the last row on the current page, fall back a page
      if (data.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchApplications();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || (t('admin.applications.deleteFailed') || 'Unable to delete application.'));
    } finally {
      setDeletingId(null);
    }
  };

  const resumeUrl = (app) => {
    if (!app) return '';
    const url = app.resumeUrl || app.applicant?.cv;
    return url ? `${api.defaults.baseURL}/applications/${app._id}/resume` : null;
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('admin.applications.title') || 'Applications'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t('admin.applications.subtitle') || 'Review every application submitted across all employers and job postings.'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.manageJobs.refresh') || 'Refresh'}
        </button>
      </div>

      {/* ── Statistics cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <button
            key={card.key === 'total' ? 'total' : `bucket-${card.key}`}
            type="button"
            onClick={() => { if (card.key !== 'total') { setStatusFilter(card.key); setPage(1); } }}
            className={`rounded-3xl border p-4 text-left transition hover:shadow-sm ${
              statusFilter === card.key
                ? 'border-[#1769E0] bg-[#EAF2FE] shadow-sm dark:border-[#1769E0] dark:bg-emerald-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${card.color}`}>{card.icon}</div>
            <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{loading ? '—' : card.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{card.label}</p>
          </button>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.applications.searchPlaceholder') || 'Search by applicant name, email, job title, or company...'}
            className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                statusFilter === key
                  ? 'border-[#1769E0] bg-[#1769E0] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {key === 'all' ? (t('admin.applications.all') || 'All') : key}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  t('admin.applications.colApplicant') || 'Applicant Name',
                  t('admin.applications.colEmail') || 'Email',
                  t('admin.applications.colJob') || 'Job Title',
                  t('admin.applications.colCompany') || 'Company',
                  t('admin.applications.colResume') || 'Resume',
                  t('admin.applications.colStatus') || 'Status',
                  t('admin.applications.colDate') || 'Applied Date',
                  t('admin.applications.colActions') || 'Actions',
                ].map((col, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
                      <div className="mb-4 rounded-3xl bg-gray-100 p-6 text-gray-400">
                        <FiUsers className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('admin.applications.emptyTitle') || 'No applications found'}
                      </h3>
                      <p className="mt-2 max-w-md text-sm text-gray-500">
                        {search || statusFilter !== 'all'
                          ? (t('admin.applications.emptyFiltered') || 'No applications match your current search or status filter.')
                          : (t('admin.applications.emptySub') || 'Applications submitted by job seekers will appear here automatically.')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((app) => {
                  const applicant = app.applicant || {};
                  const job = app.job || {};
                  const company = app.company || job.company || {};
                  const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || (t('admin.applications.unknown') || 'Unknown');
                  const fileName = getFileName(app.resumeUrl || applicant.cv);
                  const rUrl = resumeUrl(app);
                  return (
                    <tr key={app._id} className={`${changingId === app._id || deletingId === app._id ? 'opacity-60' : ''} transition hover:bg-gray-50 dark:hover:bg-gray-700/40`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            {applicant.avatar ? (
                              <img src={applicant.avatar} alt={name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{applicant.email || '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{job.title || '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{company.name || '—'}</td>
                      <td className="px-4 py-4">
                        {rUrl ? (
                          <a
                            href={rUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={fileName || (t('admin.applications.viewCv') || 'View CV')}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-[#1769E0] hover:text-[#1769E0] dark:border-gray-700 dark:text-gray-300"
                          >
                            <FiFileText className="h-3.5 w-3.5" />
                            {fileName ? fileName.slice(0, 18) + (fileName.length > 18 ? '…' : '') : (t('admin.applications.viewCv') || 'View CV')}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">{t('admin.applications.noResume') || 'No resume'}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          disabled={changingId === app._id}
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold outline-none ring-1 cursor-pointer disabled:opacity-50 ${getStatusBadge(app.status)}`}
                          aria-label="Change application status"
                        >
                          {STATUS_CHANGE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(app.appliedAt || app.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            title={t('admin.applications.viewDetails') || 'View details'}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#1769E0] hover:text-[#1769E0] dark:border-gray-700 dark:text-gray-300"
                          >
                            <FiEye className="h-3.5 w-3.5" /> {t('admin.applications.view') || 'View'}
                          </button>
                          {rUrl && (
                            <a
                              href={`${rUrl}${rUrl.includes('?') ? '&' : '?'}download=1`}
                              title={t('admin.applications.downloadCv') || 'Download CV'}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#1769E0] hover:text-[#1769E0] dark:border-gray-700 dark:text-gray-300"
                            >
                              <FiDownload className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(app)}
                            title={t('admin.applications.delete') || 'Delete application'}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && pagination?.pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              {t('admin.applications.pageInfo', { page: pagination.page, pages: pagination.pages, total: pagination.total })
                || `Page ${pagination.page} of ${pagination.pages}  ·  ${pagination.total} total`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
              >
                {t('common.previous') || 'Previous'}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
              >
                {t('common.next') || 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && !loading && (
        <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <FiInbox className="h-5 w-5" /> {error}
        </div>
      )}

      {/* ── Details modal ───────────────────────────────────────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                  {selectedApp.applicant?.avatar ? (
                    <img src={selectedApp.applicant.avatar} alt="Applicant avatar" className="h-full w-full object-cover" />
                  ) : (
                    `${selectedApp.applicant?.firstName?.[0] || '?'}${selectedApp.applicant?.lastName?.[0] || ''}`
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedApp.applicant?.firstName} {selectedApp.applicant?.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedApp.applicant?.headline || selectedApp.applicant?.currentRole || (t('admin.applications.applicant') || 'Applicant')}</p>
                  <span className={`mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadge(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Contact information */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.contactInfo') || 'Contact Information'}</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="flex items-center gap-2"><FiMail className="h-4 w-4 text-emerald-600" />
                    <a href={`mailto:${selectedApp.applicant?.email || ''}`} className="hover:underline">{renderDetail(selectedApp.applicant?.email)}</a>
                  </p>
                  <p className="flex items-center gap-2"><FiPhone className="h-4 w-4 text-emerald-600" />
                    <a href={`tel:${selectedApp.applicant?.phone || ''}`}>{renderDetail(selectedApp.applicant?.phone)}</a>
                  </p>
                  <p className="flex items-center gap-2"><FiMapPin className="h-4 w-4 text-emerald-600" />
                    {renderDetail([selectedApp.applicant?.location?.city, selectedApp.applicant?.location?.region].filter(Boolean).join(', ') || selectedApp.applicant?.location, t('admin.applications.notProvided') || 'Not provided')}
                  </p>
                </div>
              </section>

              {/* CV & Cover letter */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.cv') || 'CV'}</h3>
                <p className="mt-3 break-all text-sm text-gray-700 dark:text-gray-300">
                  {getFileName(selectedApp.resumeUrl || selectedApp.applicant?.cv) || (t('admin.applications.noResume') || 'No resume uploaded')}
                </p>
                {resumeUrl(selectedApp) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={resumeUrl(selectedApp)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
                    >
                      <FiEye className="h-4 w-4" /> {t('admin.applications.viewCv') || 'View CV'}
                    </a>
                    <a
                      href={`${resumeUrl(selectedApp)}?download=1`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#1769E0] px-4 py-2 text-sm font-semibold text-[#1769E0] transition hover:bg-[#EAF2FE]"
                    >
                      <FiDownload className="h-4 w-4" /> {t('admin.applications.downloadCv') || 'Download CV'}
                    </a>
                  </div>
                )}
              </section>
            </div>

            {/* Cover letter */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.coverLetter') || 'Cover Letter'}</h3>
              <p className="mt-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                {renderDetail(selectedApp.coverLetter, t('admin.applications.noCoverLetter') || 'No cover letter provided.')}
              </p>
            </section>

            {/* Skills */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.skills') || 'Skills'}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedApp.applicant?.skills || []).length > 0 ? (
                  selectedApp.applicant.skills.map((skill) => (
                    <span key={skill._id || skill} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {skill.name || skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">{t('admin.applications.noSkills') || 'No skills provided.'}</p>
                )}
              </div>
            </section>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Education */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.education') || 'Education'}</h3>
                {Array.isArray(selectedApp.applicant?.educationDetails) && selectedApp.applicant.educationDetails.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {selectedApp.applicant.educationDetails.map((ed, i) => (
                      <li key={i}>• {ed.degree || 'Degree'} — {ed.institution || 'Institution'}{ed.startDate ? ` (${ed.startDate}${ed.endDate ? ` – ${ed.endDate}` : ''})` : ''}</li>
                    ))}
                  </ul>
                ) : Array.isArray(selectedApp.applicant?.education) && selectedApp.applicant.education.length > 0 ? (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{selectedApp.applicant.education.join(', ')}</p>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">{t('admin.applications.noEducation') || 'No education provided.'}</p>
                )}
              </section>

              {/* Experience */}
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.experience') || 'Experience'}</h3>
                {Array.isArray(selectedApp.applicant?.experienceDetails) && selectedApp.applicant.experienceDetails.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {selectedApp.applicant.experienceDetails.map((exp, i) => (
                      <li key={i}>• {exp.title || 'Position'} — {exp.company || 'Company'}{exp.startDate ? ` (${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ''})` : ''}</li>
                    ))}
                  </ul>
                ) : selectedApp.applicant?.experience ? (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{selectedApp.applicant.experience}</p>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    {selectedApp.applicant?.experienceYears
                      ? `${selectedApp.applicant.experienceYears} years`
                      : (t('admin.applications.noExperience') || 'No experience provided.')}
                  </p>
                )}
              </section>
            </div>

            {/* Job info */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('admin.applications.jobInfo') || 'Job Information'} · {selectedApp.job?.title || '—'}
              </h3>
              <div className="mt-3 grid gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2 lg:grid-cols-3">
                <p><span className="font-medium">{t('admin.applications.jobType') || 'Type'}:</span> {renderDetail(selectedApp.job?.jobType)}</p>
                <p><span className="font-medium">{t('admin.applications.workMode') || 'Work Mode'}:</span> {renderDetail(selectedApp.job?.workMode)}</p>
                <p><span className="font-medium">{t('admin.applications.experienceLevel') || 'Level'}:</span> {renderDetail(selectedApp.job?.experienceLevel)}</p>
                <p><span className="font-medium">{t('admin.applications.salary') || 'Salary'}:</span>{' '}
                  {selectedApp.job?.salary?.min || selectedApp.job?.salary?.max
                    ? `${selectedApp.job.salary.currency || 'ETB'} ${selectedApp.job.salary.min || ''}${selectedApp.job.salary.max ? ` – ${selectedApp.job.salary.max}` : ''}`
                    : (t('admin.applications.notSpecified') || 'Not specified')}
                </p>
                <p className="flex items-center gap-1"><FiMapPin className="h-4 w-4 text-emerald-600" />
                  {[selectedApp.job?.location?.city, selectedApp.job?.location?.region].filter(Boolean).join(', ') || '—'}
                </p>
                <p className="flex items-center gap-1"><FiCalendar className="h-4 w-4 text-emerald-600" />
                  {t('admin.applications.deadline') || 'Deadline'}: {formatDate(selectedApp.job?.applicationDeadline)}
                </p>
              </div>
            </section>

            {/* Company info */}
            <section className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('admin.applications.companyInfo') || 'Company Information'}</h3>
              <div className="mt-3 grid gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                <p className="flex items-center gap-2"><FiBriefcase className="h-4 w-4 text-emerald-600" />{renderDetail(selectedApp.company?.name || selectedApp.job?.company?.name)}</p>
                <p>{t('admin.applications.industry') || 'Industry'}: {renderDetail(selectedApp.company?.industry)}</p>
                {selectedApp.company?.website && (
                  <p className="sm:col-span-2">
                    <FiMail className="mr-1 inline h-4 w-4 text-emerald-600" />
                    <a href={selectedApp.company.website} target="_blank" rel="noreferrer" className="hover:underline">{selectedApp.company.website}</a>
                  </p>
                )}
              </div>
            </section>

            {/* Applied date + status control */}
            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-900/10">
              <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FiClock className="h-4 w-4 text-emerald-600" />
                {t('admin.applications.appliedDate') || 'Applied'} {formatDate(selectedApp.appliedAt || selectedApp.createdAt)}
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('admin.applications.colStatus') || 'Status'}:
                </label>
                <select
                  value={selectedApp.status}
                  onChange={(e) => { handleStatusChange(selectedApp._id, e.target.value); setSelectedApp((prev) => prev ? { ...prev, status: e.target.value } : prev); }}
                  disabled={changingId === selectedApp._id}
                  className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold outline-none ring-1 cursor-pointer disabled:opacity-50 ${getStatusBadge(selectedApp.status)}`}
                >
                  {STATUS_CHANGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <FiTrash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.applications.deleteTitle') || 'Delete application'}</h2>
                <p className="text-sm text-gray-500">
                  {deleteTarget.applicant?.firstName} {deleteTarget.applicant?.lastName} — {deleteTarget.job?.title || ''}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              {t('admin.applications.deleteConfirm') || 'This permanently deletes the application and removes it from the applicant, the employer, and your statistics. This action cannot be undone.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget._id}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('admin.manageJobs.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId === deleteTarget._id}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingId === deleteTarget._id
                  ? (t('common.loading') || 'Deleting...')
                  : (t('admin.applications.delete') || 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;