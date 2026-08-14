import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiBriefcase,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiMapPin,
  FiEye,
  FiAlertCircle,
  FiStar,
  FiLayers,
  FiTrendingUp,
  FiSend,
  FiShield,
  FiUsers,
  FiGrid,
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import {
  fetchAdminJobs,
  approveAdminJob,
  rejectAdminJob,
} from '../../../store/slices/adminSlice';

// ─────────────────────────────────────────────────────────────────────────────
// Embedded employment-themed background art (subtle, stays behind the UI)
// ─────────────────────────────────────────────────────────────────────────────
const BackgroundArt = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* Soft ambient gradient orbs */}
    <div className="absolute -right-40 -top-48 h-[560px] w-[560px] rounded-full bg-emerald-200/40 blur-[120px] dark:bg-emerald-500/10" />
    <div className="absolute -left-44 top-1/3 h-[480px] w-[480px] rounded-full bg-sky-200/40 blur-[120px] dark:bg-sky-500/10" />

    {/* City skyline + professional scene */}
    <svg
      className="absolute bottom-0 right-0 w-full max-w-[1200px] text-[#0E7D5B] opacity-[0.42] dark:text-[#2FBF8B] dark:opacity-[0.2]"
      viewBox="0 0 1200 380"
      fill="none"
    >
      <defs>
        <linearGradient id="mj-sky" x1="0" y1="0" x2="0" y2="380" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0FAF6" />
          <stop offset="1" stopColor="#E3F2EA" />
        </linearGradient>
      </defs>

      {/* soft sky panel */}
      <path d="M1200 0H0V300C120 250 200 250 320 280C440 310 540 235 660 255C780 275 880 215 1000 235C1100 250 1150 258 1200 245V0Z" fill="url(#mj-sky)" opacity="0.55" />
      <path d="M1200 0H0V258C130 218 230 232 350 260C470 288 570 222 700 242C820 260 930 214 1040 232C1120 246 1170 250 1200 244V0Z" fill="#ffffff" opacity="0.55" />

      {/* clouds */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="180" cy="70" rx="52" ry="18" />
        <ellipse cx="150" cy="78" rx="34" ry="13" />
        <ellipse cx="214" cy="78" rx="30" ry="12" />
        <ellipse cx="1010" cy="96" rx="58" ry="19" />
        <ellipse cx="975" cy="105" rx="34" ry="13" />
        <ellipse cx="1048" cy="105" rx="32" ry="12" />
      </g>

      {/* buildings */}
      <g fill="#DCEFE6" fillOpacity="0.85" stroke="#BFE0CF" strokeOpacity="0.7">
        <path d="M0 320v-70h34v22h26v-44h40v-30h30v80h-26v-16h-22v40H80v-30H40v48H0Z" />
        <path d="M150 320v-96h44v34h22v-22h30v84h-30v-30h-22v30h-44Z" />
        <path d="M300 320v-120h50v42h30v-24h26v102h-26v-44h-30v44h-50Z" />
        <path d="M430 320v-84h40v30h24v-18h28v72h-28v-28h-24v28h-40Z" />
        <path d="M560 320v-132h36v10h-14v112h78v-58h26v68h-54v-24h-72Z" />
      </g>

      {/* building windows */}
      <g fill="#8CCCB0" opacity="0.55">
        {[
          [14, 268, 20, 8], [14, 286, 20, 8], [96, 268, 20, 8],
          [244, 252, 20, 8], [244, 272, 20, 8], [168, 292, 20, 8],
          [318, 232, 20, 8], [318, 252, 20, 8], [318, 272, 20, 8], [318, 292, 20, 8],
          [368, 232, 20, 8], [368, 252, 20, 8], [368, 272, 20, 8],
          [446, 244, 18, 8], [446, 264, 18, 8], [446, 284, 18, 8],
          [576, 216, 20, 8], [576, 236, 20, 8], [649, 226, 20, 8], [649, 246, 20, 8],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="3" />
        ))}
      </g>

      {/* professional person carrying a briefcase */}
      <g fill="#0E7D5B" opacity="0.9">
        <circle cx="1030" cy="238" r="11" />
        <path d="M1018 282v-22c0-6 5-10 12-10s12 4 12 10v22c0 6-5 10-12 10s-12-4-12-10Z" />
        <path d="M1014 286l-12 22 10 6 10-20-8-8Z" />
        <path d="M1046 286l12 22-10 6-10-20 8-8Z" />
        <path d="M1022 296h16v6h-16v6h16v6h-16z" transform="translate(0 6)" />
        <path d="M1048 266c4 3 6 8 6 13v4l-14-2v-6c0-2 2-3 3-4l5-5Z" />
      </g>
      {/* briefcase */}
      <g stroke="#0E7D5B" strokeWidth="3" fill="none" opacity="0.9">
        <rect x="1024" y="300" width="34" height="22" rx="5" />
        <path d="M1032 300v-5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v5" />
      </g>

      {/* plant */}
      <g fill="#4FBC86" opacity="0.8">
        <path d="M1120 360c8-18-4-34-20-40-16 6-28 22-20 40" />
        <path d="M1128 360c10-26-6-48-26-56-20 8-34 30-26 56" />
        <path d="M1108 360c6-14-6-24-16-28-10 4-20 14-14 28" />
        <rect x="1098" y="360" width="44" height="8" rx="4" />
      </g>

      {/* subtle rings + dots */}
      <g stroke="#9BD6BE" strokeWidth="2" fill="none" opacity="0.7">
        <circle cx="240" cy="150" r="26" />
        <circle cx="940" cy="150" r="20" strokeDasharray="4 6" />
      </g>
      <g fill="#79C7A6" opacity="0.55">
        <circle cx="280" cy="120" r="4" />
        <circle cx="300" cy="200" r="3" />
        <circle cx="192" cy="190" r="3" />
        <circle cx="890" cy="120" r="4" />
        <circle cx="1110" cy="176" r="3" />
        <circle cx="500" cy="110" r="3" />
      </g>
    </svg>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Job-management illustration used inside the empty state (right side)
// ─────────────────────────────────────────────────────────────────────────────
const EmptyStateIllustration = () => (
  <svg
    className="h-auto w-full max-w-[340px]"
    viewBox="0 0 340 300"
    fill="none"
    role="img"
    aria-label="Job management illustration"
  >
    <defs>
      <linearGradient id="es-bg" x1="0" y1="0" x2="340" y2="300" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E9F7F0" />
        <stop offset="1" stopColor="#DCEEFF" />
      </linearGradient>
    </defs>

    {/* backdrop */}
    <rect x="20" y="20" width="300" height="260" rx="40" fill="url(#es-bg)" />

    {/* monitor */}
    <g>
      <rect x="102" y="66" width="136" height="96" rx="12" fill="#FFFFFF" stroke="#D6EBE1" strokeWidth="2" />
      <rect x="112" y="76" width="116" height="76" rx="8" fill="#F3FAF6" />
      <circle cx="170" cy="90" r="7" fill="#B9E5D0" />
      <rect x="184" y="86" width="34" height="4" rx="2" fill="#CBEADB" />
      <rect x="124" y="108" width="52" height="6" rx="3" fill="#D9F0E5" />
      <rect x="184" y="104" width="44" height="14" rx="5" fill="#FFFFFF" stroke="#CFE7DB" />
      <circle cx="196" cy="111" r="3.5" fill="#0E7D5B" />
      <rect x="204" y="109" width="18" height="3" rx="1.5" fill="#9BD6BE" />
      <rect x="124" y="124" width="92" height="6" rx="3" fill="#E3F3EB" />
      <rect x="124" y="136" width="70" height="6" rx="3" fill="#E9F6EF" />
      <rect x="114" y="130" width="34" height="8" rx="4" fill="#0E7D5B" />
    </g>

    {/* briefcase */}
    <g>
      <path d="M118 172h36v-14h36v14h36" stroke="#0E7D5B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="118" y="170" width="72" height="48" rx="10" fill="#0E7D5B" />
      <rect x="136" y="182" width="36" height="24" rx="5" fill="#55C290" />
      <rect x="132" y="191" width="12" height="4" rx="2" fill="#FFFFFF" opacity="0.9" />
    </g>

    {/* magnifying glass */}
    <g>
      <circle cx="232" cy="196" r="24" fill="#FFFFFF" stroke="#0E7D5B" strokeWidth="6" />
      <path d="M249 211l18 18" stroke="#0E7D5B" strokeWidth="7" strokeLinecap="round" />
      <path d="M222 194a14 14 0 0 1 7-12" stroke="#9BD6BE" strokeWidth="4" strokeLinecap="round" />
    </g>

    {/* paper plane */}
    <g>
      <path d="M82 84l150 34-150 26 18-26z" fill="#0E7D5B" />
      <path d="M100 108l132 36-16 10z" fill="#55C290" />
      <path d="M84 86l92 40-20 26z" fill="#0E7D5B" opacity="0.55" />
      <path d="M120 128l46 16-8 18z" fill="#CBEADB" />
      <path d="M82 84c18-8 40-10 62-8" stroke="#8FCDB1" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
    </g>

    {/* dots + rings */}
    <g fill="#8FCDB1" opacity="0.7">
      <circle cx="268" cy="72" r="4" />
      <circle cx="286" cy="94" r="3" />
      <circle cx="58" cy="210" r="4" />
      <circle cx="74" cy="238" r="3" />
    </g>
    <circle cx="282" cy="140" r="14" stroke="#A8DCC4" strokeWidth="3" />
    <path d="M60 150c14-6 24-6 34 0" stroke="#A8DCC4" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status, isApproved }) => {
  const { t } = useTranslation();
  if (status === 'published' || isApproved) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <FiCheckCircle className="h-3.5 w-3.5" /> {t('admin.status.published') || 'Published'}
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        <FiClock className="h-3.5 w-3.5" /> {t('admin.status.pending') || 'Pending'}
      </span>
    );
  }
  if (status === 'closed' || status === 'expired') {
    const key = status === 'closed' ? 'admin.status.closed' : 'admin.status.expired';
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
        <FiXCircle className="h-3.5 w-3.5" /> {t(key) || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
      <FiXCircle className="h-3.5 w-3.5" /> {t('admin.status.rejected') || 'Rejected'}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Reject modal
// ─────────────────────────────────────────────────────────────────────────────
const RejectModal = ({ job, onConfirm, onCancel, loading }) => {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiAlertCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.manageJobs.rejectJobTitle') || 'Reject Job Posting'}</h2>
            <p className="text-sm text-gray-500">{job.title}</p>
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('admin.manageJobs.adminNote') || 'Admin note (optional)'}
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('admin.manageJobs.rejectionReasonPlaceholder') || 'Reason for rejection...'}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            {t('admin.manageJobs.cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(note)}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (t('admin.manageJobs.rejecting') || 'Rejecting...') : (t('admin.manageJobs.reject') || 'Reject')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Job card (polished, premium)
// ─────────────────────────────────────────────────────────────────────────────
const JobCard = ({ job, onApprove, onReject, actionLoading }) => {
  const { t } = useTranslation();
  const company = job.company || {};
  const location = [job.location?.city, job.location?.region].filter(Boolean).join(', ') || '—';
  const deadline = job.applicationDeadline ? format(new Date(job.applicationDeadline), 'dd MMM yyyy') : '—';
  const postedAt = job.createdAt ? format(new Date(job.createdAt), 'dd MMM yyyy') : '—';
  const isPending = job.status === 'pending' && !job.isApproved;
  const isPublished = job.status === 'published' || job.isApproved;

  return (
    <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400">
            {company.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-white">{job.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{company.name || (t('admin.manageJobs.unknownCompany') || 'Unknown company')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1"><FiMapPin className="h-3 w-3" />{location}</span>
              <span className="inline-flex items-center gap-1"><FiBriefcase className="h-3 w-3" />{job.jobType || '—'}</span>
              <span className="inline-flex items-center gap-1"><FiClock className="h-3 w-3" />{t('admin.manageJobs.posted') || 'Posted'} {postedAt}</span>
              <span>{t('admin.manageJobs.deadline') || 'Deadline'}: {deadline}</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
          <StatusBadge status={job.status} isApproved={job.isApproved} />
          <div className="mt-1 flex flex-wrap gap-2">
            <Link
              to={`/jobs/${job._id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            >
              <FiEye className="h-3.5 w-3.5" /> {t('admin.manageJobs.preview') || 'Preview'}
            </Link>
            {isPending && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onApprove(job)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1769E0] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0D5BC4] disabled:opacity-50"
                >
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  {actionLoading === job._id ? (t('admin.manageJobs.approving') || 'Approving...') : (t('admin.manageJobs.approve') || 'Approve')}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onReject(job)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <FiXCircle className="h-3.5 w-3.5" />
                  {t('admin.manageJobs.reject') || 'Reject'}
                </button>
              </>
            )}
            {isPublished && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FE] px-3 py-1.5 text-xs font-semibold text-[#1769E0]">
                <FiStar className="h-3.5 w-3.5" /> {t('admin.status.live') || 'Live'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature card (bottom section)
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { key: 'quality', icon: FiShield, tint: 'bg-[#EAF2FE] text-[#1769E0]', ring: 'ring-emerald-100' },
  { key: 'opportunities', icon: FiTrendingUp, tint: 'bg-sky-50 text-sky-600', ring: 'ring-sky-100' },
  { key: 'notifications', icon: FiSend, tint: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
  { key: 'growth', icon: FiUsers, tint: 'bg-violet-50 text-violet-600', ring: 'ring-violet-100' },
];

const FeatureCard = ({ feature }) => {
  const { t } = useTranslation();
  const Icon = feature.icon;
  return (
    <div className="group flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80">
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-8 ${feature.tint} ${feature.ring} dark:ring-gray-800`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
        {t(`admin.manageJobs.features.${feature.key}.title`)}
      </h3>
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t(`admin.manageJobs.features.${feature.key}.text`)}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
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

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: 'All', sub: 'admin.manageJobs.allJobsSub', icon: FiGrid, value: 'text-gray-900 dark:text-white', tint: 'bg-emerald-50 text-emerald-600', accent: 'bg-emerald-500' },
  { key: 'Pending', sub: 'admin.manageJobs.pendingSub', icon: FiClock, value: 'text-amber-600', tint: 'bg-amber-50 text-amber-600', accent: 'bg-amber-500' },
  { key: 'Published', sub: 'admin.manageJobs.publishedSub', icon: FiLayers, value: 'text-sky-600', tint: 'bg-sky-50 text-sky-600', accent: 'bg-sky-500' },
  { key: 'Rejected', sub: 'admin.manageJobs.rejectedSub', icon: FiXCircle, value: 'text-rose-600', tint: 'bg-rose-50 text-rose-600', accent: 'bg-rose-500' },
];

const AdminManageJobs = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { jobs, jobsLoading } = useSelector((state) => state.admin);

  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [company, setCompany] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminJobs({ limit: 200 }));
    api.get('/admin/categories').then((res) => setCategories(res.data?.data || [])).catch(() => {});
    api.get('/admin/companies', { params: { limit: 200 } }).then((res) => setCompanies(res.data?.data || [])).catch(() => {});
  }, [dispatch]);

  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Unique locations derived from the loaded jobs (no dedicated endpoint).
  const locations = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.location?.region?.trim()) set.add(j.location.region.trim());
      if (j.location?.city?.trim()) set.add(j.location.city.trim());
    });
    return Array.from(set);
  }, [jobs]);

  const counts = useMemo(() => ({
    All: jobs.length,
    Pending: jobs.filter((j) => j.status === 'pending' && !j.isApproved).length,
    Published: jobs.filter((j) => j.status === 'published' || j.isApproved).length,
    Rejected: jobs.filter((j) => !j.isApproved && j.status !== 'pending').length,
  }), [jobs]);

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (tab === 'Pending') list = list.filter((j) => j.status === 'pending' && !j.isApproved);
    if (tab === 'Published') list = list.filter((j) => j.status === 'published' || j.isApproved);
    if (tab === 'Rejected') list = list.filter((j) => !j.isApproved && j.status !== 'pending');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.name?.toLowerCase().includes(q) ||
        j.location?.region?.toLowerCase().includes(q) ||
        j.location?.city?.toLowerCase().includes(q)
      );
    }

    if (category !== 'all') {
      list = list.filter((j) => [j.category?._id, j.category?._id?.toString()].includes(category) || j.category?.name === category);
    }
    if (company !== 'all') {
      list = list.filter((j) => [j.company?._id, j.company?._id?.toString()].includes(company) || j.company?.name === company);
    }
    if (location !== 'all') {
      list = list.filter((j) => j.location?.region === location || j.location?.city === location);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [jobs, tab, search, category, location, company]);

  const handleApprove = async (job) => {
    setActionLoading(job._id);
    try {
      await dispatch(approveAdminJob({ jobId: job._id })).unwrap();
      toast.success(t('admin.manageJobs.approveSuccess', { title: job.title }) || `"${job.title}" approved and published.`);
    } catch (err) {
      toast.error(err || (t('admin.manageJobs.approveFailed') || 'Failed to approve job.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (note) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget._id);
    try {
      await dispatch(rejectAdminJob({ jobId: rejectTarget._id, adminNote: note })).unwrap();
      toast.success(t('admin.manageJobs.rejectSuccess', { title: rejectTarget.title }) || `"${rejectTarget.title}" rejected.`);
      setRejectTarget(null);
    } catch (err) {
      toast.error(err || (t('admin.manageJobs.rejectFailed') || 'Failed to reject job.'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-8 pb-12">
      {/* Subtle background illustration */}
      <BackgroundArt />

      <div className="relative z-10 space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{t('admin.manageJobs.title') || 'Manage Jobs'}</h1>
            <p className="mt-1 max-w-2xl text-gray-500 dark:text-gray-400">
              {t('admin.manageJobs.subtitle') || 'Review and approve job postings. Approval publishes the job and notifies all Job Seekers.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchAdminJobs({ limit: 200 }))}
            disabled={jobsLoading}
            className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1769E0]/20 transition hover:bg-[#0D5BC4] disabled:opacity-50 dark:bg-[#1769E0] dark:hover:bg-[#0D5BC4]"
          >
            <FiRefreshCw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
            {t('admin.manageJobs.refresh') || 'Refresh'}
          </button>
        </div>

        {/* ── Statistics cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const isActive = tab === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setTab(card.key)}
                className={`group relative overflow-hidden rounded-3xl border p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  isActive
                    ? 'border-[#1769E0] bg-white shadow-md dark:border-[#1769E0] dark:bg-gray-800'
                    : 'border-gray-100 bg-white hover:border-[#1769E0] dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                {/* bottom accent line */}
                <span className={`absolute inset-x-0 bottom-0 h-1 ${card.accent} ${isActive ? '' : 'opacity-40'} transition-opacity group-hover:opacity-100`} />
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tint}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  {isActive && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {t('common.active') || 'Active'}
                    </span>
                  )}
                </div>
                <p className={`mt-4 text-3xl font-black ${card.value}`}>{jobsLoading ? '—' : counts[card.key]}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t(`admin.status.${card.key.toLowerCase()}`) || card.key}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t(card.sub)}</p>
              </button>
            );
          })}
        </div>

        {/* ── Search + filters ────────────────────────────────────────────── */}
        <div className="relative rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.manageJobs.searchPlaceholder') || 'Search by job title, company, or location...'}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { value: category, set: setCategory, all: 'all', label: t('admin.manageJobs.allCategories') || 'All Categories', options: categories.map((c) => ({ v: c._id, l: c.name })) },
              { value: location, set: setLocation, all: 'all', label: t('admin.manageJobs.allLocations') || 'All Locations', options: locations.map((l) => ({ v: l, l })) },
              { value: company, set: setCompany, all: 'all', label: t('admin.manageJobs.allCompanies') || 'All Companies', options: companies.map((c) => ({ v: c._id, l: c.name })) },
            ].map((f, idx) => (
              <select
                key={idx}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                aria-label={f.label}
              >
                <option value={f.all}>{f.label}</option>
                {f.options.map((o) => (
                  <option key={`${idx}-${o.v}`} value={o.v}>{o.l}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* ── Results / Empty state ──────────────────────────────────────── */}
        {jobsLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/80 bg-white/95 shadow-xl shadow-emerald-900/5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
            {/* faint decorative wash inside the panel */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-50/80 blur-2xl dark:bg-emerald-500/10" />

            <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center md:p-12">
              {/* Left: copy + CTA */}
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  {t('admin.manageJobs.allClear') || 'All clear'}
                </span>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  {t('admin.manageJobs.noPendingTitle') || 'No pending jobs to review'}
                </h2>
                <p className="mt-3 max-w-md text-base text-gray-500 dark:text-gray-400">
                  {t('admin.manageJobs.noPendingSubtitle') || 'All caught up — no jobs awaiting approval right now.'}
                </p>
                <p className="mt-1.5 max-w-md text-sm text-gray-400 dark:text-gray-500">
                  {t('admin.manageJobs.newJobsAppear') || 'New job postings will appear here for review.'}
                </p>
                <button
                  type="button"
                  onClick={() => setTab('All')}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1769E0]/25 transition hover:-translate-y-0.5 hover:bg-[#0D5BC4] dark:bg-[#1769E0] dark:hover:bg-[#0D5BC4]"
                >
                  {t('admin.manageJobs.viewAllJobs') || 'View All Jobs'}
                  <FiEye className="h-4 w-4" />
                </button>
              </div>

              {/* Right: illustration */}
              <div className="flex w-full items-center justify-center md:w-auto md:flex-1 md:justify-end">
                <div className="relative">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-gradient-to-br from-emerald-100/60 to-sky-100/60 blur-2xl dark:from-emerald-500/10 dark:to-sky-500/10" />
                  <EmptyStateIllustration />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* ── Bottom feature section ─────────────────────────────────────── */}
        <section className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
              {t('admin.manageJobs.whyTrusted') || 'Why Job Seekers Trust This Platform'}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.key} feature={feature} />
            ))}
          </div>
        </section>
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