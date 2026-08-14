import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiBriefcase, FiHome, FiCheckCircle,
  FiTrendingUp, FiAlertCircle, FiFileText, FiChevronRight,
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchAdminStats } from '../../../store/slices/adminSlice';
import api from '../../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RANGES = {
  '7D': '7d',
  '30D': '30d',
  '3M': '3m',
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);

  const [range, setRange] = useState('30D');
  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState(false);
  const [pendingJobs, setPendingJobs] = useState(0);
  const [pendingCertificates, setPendingCertificates] = useState(0);
  const [activityLoading, setActivityLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Always render a clean string label — never a translation object or error text
  const label = useCallback(
    (key, fallback) => {
      const value = t(key);
      return typeof value === 'string' && value.trim() ? value : fallback;
    },
    [t]
  );

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  // Fetch real Platform Activity data from the dedicated DB-driven endpoint.
  // Counts and the chart series are computed server-side from real records so
  // they stay consistent with the rest of the dashboard (e.g. Total Users).
  // The 7D/30D/3M toggle refetches so each range recalculates from the database.
  useEffect(() => {
    let cancelled = false;
    setActivityLoading(true);
    setActivityError(false);
    api
      .get('/admin/dashboard/activity', { params: { range: RANGES[range] } })
      .then((res) => {
        if (cancelled) return;
        setActivity(res.data?.data || null);
        setActivityError(false);
      })
      .catch((err) => {
        console.error('Failed to load platform activity:', err);
        if (cancelled) return;
        setActivity(null);
        setActivityError(true);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  // Pending jobs / certificates (fetched once) for the Pending Approvals card.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/admin/jobs', { params: { status: 'pending', limit: 1 } }).catch(() => null),
      api.get('/admin/certificates', { params: { limit: 1 } }).catch(() => null),
    ]).then(([pendingJobsRes, certificatesRes]) => {
      if (cancelled) return;
      setPendingJobs(pendingJobsRes?.data?.pagination?.total ?? 0);
      setPendingCertificates(certificatesRes?.data?.stats?.pendingReviews ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCompanies = stats?.overview?.pendingCompanies ?? 0;
  const totalPending = pendingCompanies + pendingJobs + pendingCertificates;

  // ── Derived counts for the selected time range (from real DB endpoint) ──
  const activityMetrics = useMemo(() => {
    const counts = activity?.counts || {};
    return {
      users: counts.users ?? 0,
      companies: counts.companies ?? 0,
      jobs: counts.jobs ?? 0,
      applications: counts.applications ?? 0,
    };
  }, [activity]);

  // ── Chart series (server-computed buckets over the selected window) ──
  const chartData = useMemo(() => {
    const chart = activity?.chart;
    if (!chart?.labels) return null;
    return {
      labels: chart.labels,
      datasets: [
        {
          label: label('admin.newUsers', 'New Users'),
          data: chart.users || [],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2,132,199,0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: label('admin.newCompanies', 'New Companies'),
          data: chart.companies || [],
          borderColor: '#087F5B',
          backgroundColor: 'rgba(8,127,91,0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: label('admin.newJobs', 'New Jobs'),
          data: chart.jobs || [],
          borderColor: '#d97706',
          backgroundColor: 'rgba(217,119,6,0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: label('admin.newApplications', 'New Applications'),
          data: chart.applications || [],
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  }, [activity, label]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, font: { size: 10 } },
      },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } },
      x: { ticks: { maxTicksLimit: 8, font: { size: 10 } } },
    },
  };

  const cardClass =
    'rounded-2xl p-6 border shadow-[0_5px_20px_rgba(20,60,45,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md';

  const pendingRows = [
    {
      key: 'companies',
      count: pendingCompanies,
      label: label('admin.pendingCompanies', 'Pending Companies'),
      icon: <FiHome className="h-4 w-4" />,
      iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40',
      to: '/admin/companies',
    },
    {
      key: 'jobs',
      count: pendingJobs,
      label: label('admin.pendingJobs', 'Pending Jobs'),
      icon: <FiBriefcase className="h-4 w-4" />,
      iconClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40',
      to: '/admin/jobs',
    },
    {
      key: 'certificates',
      count: pendingCertificates,
      label: label('admin.pendingCertificates', 'Pending Certificates'),
      icon: <FiFileText className="h-4 w-4" />,
      iconClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40',
      to: '/admin/certificates',
    },
  ];

  const activityTiles = [
    { key: 'users', count: activityMetrics.users, label: label('admin.newUsers', 'New Users'), icon: <FiUsers className="h-5 w-5" />, color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400' },
    { key: 'companies', count: activityMetrics.companies, label: label('admin.newCompanies', 'New Companies'), icon: <FiHome className="h-5 w-5" />, color: 'bg-[#DCF2E8] dark:bg-emerald-950/40 text-[#065F46] dark:text-[#25C58A]' },
    { key: 'jobs', count: activityMetrics.jobs, label: label('admin.newJobs', 'New Jobs'), icon: <FiBriefcase className="h-5 w-5" />, color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
    { key: 'applications', count: activityMetrics.applications, label: label('admin.newApplications', 'New Applications'), icon: <FiFileText className="h-5 w-5" />, color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* ── Admin Header ── */}
      <div className="relative z-10">
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {label('admin.dashboardTitle', 'Admin Portal Dashboard')}
        </h1>
        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label('admin.dashboardSubtitle', 'Overview of platform activity and governance')}
        </p>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Users */}
        <div
          className={cardClass}
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label('admin.totalUsers', 'Total Users')}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.overview?.totalUsers ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-[#0C4A6E]">{label('admin.jobseekersAndEmployers', '+Jobseekers & Employers')}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 p-4 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40">
              <FiUsers className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Companies */}
        <div
          className={cardClass}
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label('admin.companies', 'Companies')}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.overview?.totalCompanies ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-[#087F5B] dark:text-[#25C58A]">{label('admin.registeredOrganizations', 'Registered Organizations')}</p>
            </div>
            <div className="rounded-2xl bg-[#DCF2E8] dark:bg-emerald-950/40 p-4 text-[#065F46] dark:text-[#25C58A] border border-[#BBE4D6] dark:border-emerald-900/40">
              <FiHome className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div
          className={cardClass}
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label('admin.jobListings', 'Job Listings')}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.overview?.totalJobs ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{label('admin.platformJobPostings', 'Platform Job Postings')}</p>
            </div>
            <div className="rounded-2xl bg-[#FEF3C7] dark:bg-amber-950/40 p-4 text-[#92400E] dark:text-amber-400 border border-[#FDE68A] dark:border-amber-900/40">
              <FiBriefcase className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Applications */}
        <div
          className={cardClass}
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label('admin.applications.title', 'Applications')}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.overview?.totalApplications ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-400">{label('admin.processedSubmissions', 'Processed Submissions')}</p>
            </div>
            <div className="rounded-2xl bg-[#E9D5FF] dark:bg-violet-950/40 p-4 text-[#5B21B6] dark:text-violet-400 border border-[#DDD6FE] dark:border-violet-900/40">
              <FiCheckCircle className="h-7 w-7" />
            </div>
          </div>
        </div>

      </div>

      {/* ── Summary & Governance Section ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Pending Approvals */}
        <div
          className="rounded-2xl p-6 border shadow-[0_6px_24px_rgba(30,70,55,0.05)]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              <FiAlertCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{label('admin.pendingApprovalsTitle', 'Pending Organization Approvals')}</h2>
          </div>

          {totalPending === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-dashed p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}>
              <div className="rounded-lg bg-[#DCF2E8] dark:bg-emerald-950/40 p-2 text-[#087F5B] dark:text-[#25C58A]">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label('admin.noPendingApprovals', 'No pending approvals. All caught up!')}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {label('admin.pendingApprovalsDesc', 'Companies, jobs, and certificates currently awaiting administrative review and verification before public listing.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRows.map((row) => (
                <Link
                  key={row.key}
                  to={row.to}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${row.iconClass}`}>{row.icon}</div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">{row.count}</span>
                    <FiChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Platform Activity */}
        <div
          className="rounded-2xl p-6 border shadow-[0_6px_24px_rgba(30,70,55,0.05)]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#087F5B]/10 dark:bg-[#16A36F]/20 p-2.5 text-[#087F5B] dark:text-[#25C58A] border border-[#087F5B]/20 dark:border-[#16A36F]/30">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{label('admin.platformActivityTitle', 'Platform Activity')}</h2>
            </div>

            <div
              className="inline-flex items-center gap-1 rounded-full p-1 border"
              style={{ background: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
            >
              {Object.keys(RANGES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    range === key
                      ? 'bg-[#1769E0] text-white dark:bg-[#1769E0] dark:text-white'
                      : 'text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activityTiles.map((tile) => (
              <div
                key={tile.key}
                className="flex flex-col items-center gap-1 rounded-xl border p-3 text-center"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}
              >
                <div className={`rounded-lg p-2 ${tile.color}`}>{tile.icon}</div>
                <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{activityLoading || activityError ? '–' : tile.count}</p>
                <p className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>{tile.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 h-48">
            {activityLoading ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="h-4 w-4 rounded-full border-2 border-[#087F5B] border-t-transparent animate-spin" />
                  <span>{label('common.loading', 'Loading...')}</span>
                </div>
              </div>
            ) : activityError || !chartData ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface-secondary)' }}>
                <FiAlertCircle className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label('admin.platformActivityError', 'Unable to load activity data')}</span>
                <button
                  type="button"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="mt-1 rounded-full px-3 py-1 text-xs font-semibold bg-[#1769E0] text-white dark:bg-[#1769E0]"
                >
                  {label('admin.retry', 'Retry')}
                </button>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {label('admin.platformActivityDesc', 'New users, companies, jobs, and applications tracked across the platform for growth insights.')}
          </p>
        </div>

      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          <span className="h-4 w-4 rounded-full border-2 border-[#087F5B] border-t-transparent animate-spin" />
          <span>{label('common.loading', 'Loading...')}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
