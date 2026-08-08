import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiBriefcase, FiCheckCircle, FiXCircle, FiSearch,
  FiRefreshCcw, FiClock, FiMapPin, FiEye, FiAlertCircle,
  FiStar,
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  fetchAdminJobs,
  approveAdminJob,
  rejectAdminJob,
} from '../../../store/slices/adminSlice';

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, isApproved }) => {
  if (status === 'published' || isApproved) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <FiCheckCircle className="h-3.5 w-3.5" /> Published
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        <FiClock className="h-3.5 w-3.5" /> Pending
      </span>
    );
  }
  if (status === 'closed' || status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
        <FiXCircle className="h-3.5 w-3.5" /> {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
      <FiXCircle className="h-3.5 w-3.5" /> Rejected
    </span>
  );
};

// ── Reject modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ job, onConfirm, onCancel, loading }) => {
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiAlertCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Job Posting</h2>
            <p className="text-sm text-gray-500">{job.title}</p>
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Admin note (optional)
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for rejection..."
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-5 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(note)}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Job card ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, onApprove, onReject, actionLoading }) => {
  const company = job.company || {};
  const location = [job.location?.city, job.location?.region].filter(Boolean).join(', ') || '—';
  const deadline = job.applicationDeadline
    ? format(new Date(job.applicationDeadline), 'dd MMM yyyy')
    : '—';
  const postedAt = job.createdAt
    ? format(new Date(job.createdAt), 'dd MMM yyyy')
    : '—';

  const isPending = job.status === 'pending' && !job.isApproved;
  const isPublished = job.status === 'published' || job.isApproved;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left */}
        <div className="flex items-start gap-4">
          {/* Company logo / initials */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-lg dark:bg-emerald-900/40 dark:text-emerald-400">
            {company.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{job.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{company.name || 'Unknown company'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3" />{location}</span>
              <span className="flex items-center gap-1"><FiBriefcase className="h-3 w-3" />{job.jobType || '—'}</span>
              <span className="flex items-center gap-1"><FiClock className="h-3 w-3" />Posted {postedAt}</span>
              <span>Deadline: {deadline}</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
          <StatusBadge status={job.status} isApproved={job.isApproved} />
          <div className="flex flex-wrap gap-2 mt-1">
            <Link
              to={`/jobs/${job._id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            >
              <FiEye className="h-3.5 w-3.5" /> Preview
            </Link>
            {isPending && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onApprove(job)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  {actionLoading === job._id ? 'Approving...' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onReject(job)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  <FiXCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}
            {isPublished && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <FiStar className="h-3.5 w-3.5" /> Live
              </span>
            )}
          </div>
        </div>
      </div>

      {job.adminNote && (
        <p className="mt-3 rounded-2xl bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          📝 Admin note: {job.adminNote}
        </p>
      )}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex gap-4">
      <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = ['All', 'Pending', 'Published', 'Rejected'];

const AdminManageJobs = () => {
  const dispatch = useDispatch();
  const { jobs, jobsLoading } = useSelector((state) => state.admin);

  const [tab, setTab]             = useState('Pending');
  const [search, setSearch]       = useState('');
  const [actionLoading, setActionLoading] = useState(null); // jobId being actioned
  const [rejectTarget, setRejectTarget]   = useState(null); // job awaiting rejection modal

  useEffect(() => {
    dispatch(fetchAdminJobs());
  }, [dispatch]);

  const counts = useMemo(() => ({
    All:       jobs.length,
    Pending:   jobs.filter((j) => j.status === 'pending' && !j.isApproved).length,
    Published: jobs.filter((j) => j.status === 'published' || j.isApproved).length,
    Rejected:  jobs.filter((j) => !j.isApproved && j.status !== 'pending').length,
  }), [jobs]);

  const filtered = useMemo(() => {
    let list = [...jobs];

    if (tab === 'Pending')   list = list.filter((j) => j.status === 'pending' && !j.isApproved);
    if (tab === 'Published') list = list.filter((j) => j.status === 'published' || j.isApproved);
    if (tab === 'Rejected')  list = list.filter((j) => !j.isApproved && j.status !== 'pending');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.name?.toLowerCase().includes(q) ||
        j.location?.region?.toLowerCase().includes(q) ||
        j.location?.city?.toLowerCase().includes(q)
      );
    }

    // Newest first
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [jobs, tab, search]);

  const handleApprove = async (job) => {
    setActionLoading(job._id);
    try {
      await dispatch(approveAdminJob({ jobId: job._id })).unwrap();
      toast.success(`"${job.title}" approved and published. Job Seekers notified! 🔔`);
    } catch (err) {
      toast.error(err || 'Failed to approve job.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (note) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget._id);
    try {
      await dispatch(rejectAdminJob({ jobId: rejectTarget._id, adminNote: note })).unwrap();
      toast.success(`"${rejectTarget.title}" rejected.`);
      setRejectTarget(null);
    } catch (err) {
      toast.error(err || 'Failed to reject job.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Manage Jobs</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Review and approve job postings. Approval publishes the job and notifies all Job Seekers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchAdminJobs())}
          disabled={jobsLoading}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
        >
          <FiRefreshCcw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-3xl border p-4 text-left transition hover:shadow-sm ${
              tab === t
                ? 'border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-600 dark:bg-emerald-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t}</p>
            <p className={`mt-2 text-3xl font-black ${
              t === 'Pending'   ? 'text-amber-600'   :
              t === 'Published' ? 'text-emerald-600' :
              t === 'Rejected'  ? 'text-red-600'     : 'text-gray-900 dark:text-white'
            }`}>
              {jobsLoading ? '—' : counts[t]}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by job title, company, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Job list */}
      <div className="space-y-4">
        {jobsLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-slate-50 px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <FiBriefcase className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tab === 'Pending' ? 'No pending jobs to review' : `No ${tab.toLowerCase()} jobs`}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {tab === 'Pending'
                ? 'All caught up — no jobs awaiting approval right now.'
                : 'Jobs will appear here once available.'}
            </p>
          </div>
        ) : (
          filtered.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          job={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={actionLoading === rejectTarget._id}
        />
      )}
    </div>
  );
};

export default AdminManageJobs;
