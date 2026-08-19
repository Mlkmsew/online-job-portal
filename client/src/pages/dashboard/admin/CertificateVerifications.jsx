import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiX,
  FiXCircle,
  FiUserX,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import certificateService from '../../../services/certificateService';

const PAGE_SIZE = 10;

const STATUS_FILTERS = ['all', 'VERIFIED', 'SUSPICIOUS', 'INVALID', 'PENDING_REVIEW'];

const STATUS_META = {
  VERIFIED: { badge: 'bg-[#DCF2E8] text-[#065F46] ring-[#DCF2E8]', label: 'Verified' },
  SUSPICIOUS: { badge: 'bg-[#FEF3C7] text-[#92400E] ring-[#FEF3C7]', label: 'Suspicious' },
  INVALID: { badge: 'bg-[#FEE2E2] text-[#B91C1C] ring-[#FEE2E2]', label: 'Invalid' },
  PENDING_REVIEW: { badge: 'bg-[#E0F2FE] text-[#0C4A6E] ring-[#E0F2FE]', label: 'Pending Review' },
};

const REVIEW_META = {
  pending: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  reviewed: { label: 'Reviewed', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  marked_suspicious: { label: 'Marked Suspicious', cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
};

const FIELD_LABELS = {
  fullName: 'Name',
  studentId: 'Student ID',
  certificateNumber: 'Certificate Number',
  institution: 'Institution',
  program: 'Program',
  certificateType: 'Certificate Type',
  issueDate: 'Issue Date',
  graduationYear: 'Graduation Year',
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

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.PENDING_REVIEW;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.badge}`}>{meta.label}</span>;
};

const ReviewBadge = ({ status }) => {
  const meta = REVIEW_META[status] || REVIEW_META.pending;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.cls}`}>{meta.label}</span>;
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-100">
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 rounded bg-gray-200" style={{ width: i < 2 ? '80%' : '55%' }} />
      </td>
    ))}
  </tr>
);

const DetailsModal = ({ record, onClose, onAction, busy }) => {
  if (!record) return null;

  const mismatchedKeys = (record.mismatchedFields || []).map((m) => m.field);
  const comparisonRows = [
    { key: 'fullName', label: 'Name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'certificateNumber', label: 'Certificate Number' },
    { key: 'institution', label: 'Institution' },
    { key: 'program', label: 'Program' },
    { key: 'certificateType', label: 'Certificate Type' },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'graduationYear', label: 'Graduation Year' },
  ];

  const appName = record.user
    ? `${record.user.firstName || ''} ${record.user.lastName || ''}`.trim() || 'Applicant'
    : 'Applicant';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="my-4 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Certificate Verification Details</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Applicant</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{appName}</p>
            <p className="text-xs text-slate-500">{record.user?.email || '—'}</p>
            {record.user?.phone && <p className="text-xs text-slate-500">{record.user.phone}</p>}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Number</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-800">{record.verificationNumber || '—'}</p>
            <p className="mt-1 text-xs text-slate-500">QR scan: {record.qrScanResult?.status || 'not_detected'}</p>
          </div>
        </div>

        {record.uploadedDocument?.url && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <FiFileText className="h-5 w-5 text-slate-500" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
              {record.uploadedDocument.originalName || getFileName(record.uploadedDocument.url) || 'Uploaded document'}
            </span>
            <a
              href={record.uploadedDocument.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50"
            >
              <FiDownload className="h-3.5 w-3.5" /> View Document
            </a>
          </div>
        )}

        {record.isDuplicate && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <FiAlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <p className="text-sm font-bold text-rose-700">Duplicate Certificate — this verification number is associated with another account.</p>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Field-by-field Comparison</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Field</th>
                  <th className="px-4 py-2.5 font-bold">Uploaded</th>
                  <th className="px-4 py-2.5 font-bold">Trusted Record</th>
                  <th className="px-4 py-2.5 font-bold">Result</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(({ key, label }) => {
                  const isMismatch = mismatchedKeys.includes(key);
                  const show = isMismatch || record.uploadedData?.[key] || record.trustedRecord?.[key];
                  if (!show) return null;
                  return (
                    <tr key={key} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{FIELD_LABELS[key] || label}</td>
                      <td className="px-4 py-2.5 text-slate-600">{record.uploadedData?.[key] || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{record.trustedRecord?.[key] || '—'}</td>
                      <td className="px-4 py-2.5">
                        {isMismatch ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <FiXCircle className="h-4 w-4" /> MISMATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <FiCheckCircle className="h-4 w-4" /> MATCH
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification score */}
        {typeof record.verificationScore === 'number' && record.verificationScore > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Score</p>
              <p className={`text-lg font-extrabold ${record.verificationScore >= 80 ? 'text-emerald-600' : record.verificationScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {record.verificationScore}%
              </p>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  record.verificationScore >= 80 ? 'bg-emerald-500' : record.verificationScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${record.verificationScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Profile consistency (document vs registered account) */}
        {(() => {
          const profileRows = [
            { key: 'fullName', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
          ];
          const mismatchMap = (record.profileMismatchedFields || []).reduce((acc, m) => {
            acc[m.field] = m;
            return acc;
          }, {});
          const hasProfileRow = profileRows.some(({ key }) => {
            const m = mismatchMap[key];
            return m || record.uploadedData?.[key] || record.profileData?.[key];
          });
          if (!hasProfileRow) return null;
          return (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Profile Consistency (Document vs Account)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-bold">Field</th>
                      <th className="px-4 py-2.5 font-bold">Uploaded</th>
                      <th className="px-4 py-2.5 font-bold">Registered</th>
                      <th className="px-4 py-2.5 font-bold">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileRows.map(({ key, label }) => {
                      const m = mismatchMap[key];
                      const uploaded = m?.uploaded || record.uploadedData?.[key] || '';
                      const registered = m?.registered || record.profileData?.[key] || '';
                      const isMismatch = Boolean(m);
                      if (!isMismatch && !uploaded && !registered) return null;
                      return (
                        <tr key={key} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2.5 font-semibold text-slate-700">{label}</td>
                          <td className="px-4 py-2.5 text-slate-600">{uploaded || '—'}</td>
                          <td className="px-4 py-2.5 text-slate-600">{registered || '—'}</td>
                          <td className="px-4 py-2.5">
                            {isMismatch ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                                <FiXCircle className="h-4 w-4" /> MISMATCH
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                <FiCheckCircle className="h-4 w-4" /> MATCH
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {record.reason && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System Result</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{record.verificationStatus}</p>
            <p className="mt-1 text-sm text-slate-600">Reason: {record.reason}</p>
          </div>
        )}

        {record.reviewNotes && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Admin Notes</p>
            <p className="mt-1 text-sm text-amber-800">{record.reviewNotes}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={record.verificationStatus} />
            <ReviewBadge status={record.reviewStatus} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAction('verified')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1769E0] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0D5BC4] disabled:opacity-50"
            >
              <FiCheckCircle className="h-4 w-4" /> Verify
            </button>
            <button
              type="button"
              onClick={() => onAction('suspicious')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
            >
              <FiAlertTriangle className="h-4 w-4" /> Mark Suspicious
            </button>
            <button
              type="button"
              onClick={() => onAction('request_review')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              <FiClock className="h-4 w-4" /> Request Review
            </button>
            <button
              type="button"
              onClick={() => onAction('rejected')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
            >
              <FiXCircle className="h-4 w-4" /> Reject
            </button>
            <button
              type="button"
              onClick={() => onAction('suspend')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
            >
              <FiUserX className="h-4 w-4" /> Suspend Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminCertificateVerifications = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ VERIFIED: 0, SUSPICIOUS: 0, INVALID: 0, PENDING_REVIEW: 0, pendingReviews: 0, duplicates: 0 });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await certificateService.adminGetVerifications({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setData(res.data || []);
      setStats(res.stats || {});
      setPagination(res.pagination || {});
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load certificate verifications.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchList();
  }, [fetchList, page, statusFilter]);

  const statCards = useMemo(() => [
    { key: 'VERIFIED', label: 'Verified', value: stats.VERIFIED, color: 'bg-emerald-50 text-emerald-600', icon: <FiCheckCircle className="h-5 w-5" /> },
    { key: 'SUSPICIOUS', label: 'Suspicious', value: stats.SUSPICIOUS, color: 'bg-amber-50 text-amber-600', icon: <FiAlertTriangle className="h-5 w-5" /> },
    { key: 'INVALID', label: 'Invalid', value: stats.INVALID, color: 'bg-rose-50 text-rose-600', icon: <FiXCircle className="h-5 w-5" /> },
    { key: 'PENDING_REVIEW', label: 'Pending Review', value: stats.PENDING_REVIEW, color: 'bg-sky-50 text-sky-600', icon: <FiClock className="h-5 w-5" /> },
    { key: 'pendingReviews', label: 'Admin Reviews', value: stats.pendingReviews, color: 'bg-violet-50 text-violet-600', icon: <FiEye className="h-5 w-5" /> },
    { key: 'duplicates', label: 'Duplicates', value: stats.duplicates, color: 'bg-orange-50 text-orange-600', icon: <FiAlertCircle className="h-5 w-5" /> },
  ], [stats]);

  const openDetails = async (record) => {
    try {
      const res = await certificateService.adminGetVerification(record._id);
      setSelected(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load details.');
    }
  };

  const handleAction = async (action) => {
    if (!selected) return;
    setBusy(true);
    try {
      if (action === 'suspend') {
        if (!window.confirm('Suspend this applicant\'s account for certificate fraud?')) {
          setBusy(false);
          return;
        }
        await certificateService.adminSuspendUser(selected._id);
        toast.success('Applicant account suspended.');
      } else {
        const notes = window.prompt(
          action === 'verified' ? 'Add a review note (optional):' : 'Provide a reason for this decision (optional):',
          ''
        );
        await certificateService.adminReview(selected._id, { action, notes: notes || '' });
        toast.success('Review saved.');
      }
      const res = await certificateService.adminGetVerification(selected._id);
      setSelected(res.data);
      fetchList();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Certificate Verification & Fraud Detection</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Review certificate submissions, detect suspicious documents, and manage duplicate certificates.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-2 inline-flex rounded-xl p-2 ${card.color}`}>{card.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{card.value ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                statusFilter === f
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_META[f].label}
            </button>
          ))}
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant or number..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 md:w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-bold">Applicant</th>
                <th className="px-4 py-3 font-bold">Certificate No.</th>
                <th className="px-4 py-3 font-bold">Verification No.</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Score</th>
                <th className="px-4 py-3 font-bold">Mismatched Fields</th>
                <th className="px-4 py-3 font-bold">Duplicate</th>
                <th className="px-4 py-3 font-bold">Admin Review</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRow />
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">No certificate verifications found.</td>
                </tr>
              ) : (
                data.map((record) => {
                  const appName = record.user
                    ? `${record.user.firstName || ''} ${record.user.lastName || ''}`.trim()
                    : 'Applicant';
                  return (
                    <tr key={record._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{appName}</p>
                        <p className="text-xs text-slate-500">{record.user?.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {record.uploadedData?.certificateNumber || record.trustedRecord?.certificateNumber || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{record.verificationNumber || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={record.verificationStatus} /></td>
                      <td className="px-4 py-3">
                        {record.verificationScore > 0 ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                            record.verificationScore >= 80 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : record.verificationScore >= 50 ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : 'bg-rose-50 text-rose-700 ring-rose-200'
                          }`}>
                            {record.verificationScore}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(record.mismatchedFields || []).slice(0, 3).map((m, i) => (
                            <span key={i} className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                              {m.label}
                            </span>
                          ))}
                          {(record.profileMismatchedFields || []).slice(0, 2).map((m, i) => (
                            <span key={`p-${i}`} className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200">
                              Profile {m.label}
                            </span>
                          ))}
                          {(record.mismatchedFields || []).length === 0 && (record.profileMismatchedFields || []).length === 0 ? (
                            <span className="text-xs text-slate-400">None</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {record.isDuplicate ? (
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200">⚠ Duplicate</span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><ReviewBadge status={record.reviewStatus} /></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(record.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDetails(record)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            <FiEye className="h-3.5 w-3.5" /> Details
                          </button>
                          {record.uploadedDocument?.url && (
                            <a
                              href={record.uploadedDocument.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                              title="View document"
                            >
                              <FiDownload className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selected && (
        <DetailsModal
          record={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          busy={busy}
        />
      )}
    </div>
  );
};

export default AdminCertificateVerifications;