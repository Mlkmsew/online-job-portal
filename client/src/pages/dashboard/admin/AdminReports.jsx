import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiHome, FiBriefcase, FiFileText, FiUsers, FiUserPlus,
  FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiBarChart2, FiPieChart, FiTrendingUp,
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../../../services/api';

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, PointElement, LineElement, Tooltip, Legend);

const PALETTE = [
  '#059669', '#0284c7', '#d97706', '#7c3aed', '#db2777',
  '#dc2626', '#0891b2', '#65a30d', '#9333ea', '#ca8a04',
];

const ChartCard = ({ title, children, emptyText }) => (
  <div className="card p-5 border border-gray-200 shadow-sm">
    <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
    {children === null ? (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        {emptyText}
      </div>
    ) : (
      children
    )}
  </div>
);

const AdminReports = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports');
      setData(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Failed to load admin reports:', err);
      setError(t('admin.reports.loadFailed') || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  const metricCards = [
    { label: t('admin.reports.totalCompanies') || 'Total Companies', value: summary.totalCompanies ?? 0, icon: <FiHome className="h-6 w-6" />, color: 'bg-[#DCF2E8] text-[#065F46]' },
    { label: t('admin.reports.activeJobs') || 'Active Jobs', value: summary.activeJobs ?? 0, icon: <FiBriefcase className="h-6 w-6" />, color: 'bg-[#E0F2FE] text-[#0C4A6E]' },
    { label: t('admin.reports.totalApplications') || 'Total Applications', value: summary.totalApplications ?? 0, icon: <FiFileText className="h-6 w-6" />, color: 'bg-[#FEF3C7] text-[#92400E]' },
    { label: t('admin.reports.totalJobSeekers') || 'Total Job Seekers', value: summary.totalJobSeekers ?? 0, icon: <FiUsers className="h-6 w-6" />, color: 'bg-[#E9D5FF] text-[#5B21B6]' },
    { label: t('admin.reports.totalEmployers') || 'Total Employers', value: summary.totalEmployers ?? 0, icon: <FiUserPlus className="h-6 w-6" />, color: 'bg-[#FEE2E2] text-[#B91C1C]' },
    { label: t('admin.reports.pendingJobs') || 'Pending Jobs', value: summary.pendingJobs ?? 0, icon: <FiClock className="h-6 w-6" />, color: 'bg-[#EDE9FE] text-[#5B21B6]' },
    { label: t('admin.reports.pendingCompanies') || 'Pending Companies', value: summary.pendingCompanies ?? 0, icon: <FiAlertCircle className="h-6 w-6" />, color: 'bg-[#FEF3C7] text-[#92400E]' },
    { label: t('admin.reports.hiredCandidates') || 'Hired Candidates', value: summary.hiredCandidates ?? 0, icon: <FiCheckCircle className="h-6 w-6" />, color: 'bg-[#DCF2E8] text-[#065F46]' },
    { label: t('admin.reports.rejectedApplications') || 'Rejected Applications', value: summary.rejectedApplications ?? 0, icon: <FiXCircle className="h-6 w-6" />, color: 'bg-[#FEE2E2] text-[#B91C1C]' },
  ];

  const statusData = charts.applicationsByStatus || [];
  const statusLabels = statusData.map((s) => s._id);
  const statusCounts = statusData.map((s) => s.count);

  const categoryData = charts.jobsByCategory || [];
  const categoryLabels = categoryData.map((c) => c.name);
  const categoryCounts = categoryData.map((c) => c.count);

  const jobsOverTimeData = charts.jobsOverTime || [];
  const jobsTimeLabels = jobsOverTimeData.map((d) => d.date);
  const jobsTimeCounts = jobsOverTimeData.map((d) => d.count);

  const applicationsOverTimeData = charts.applicationsOverTime || [];
  const applicationsTimeLabels = applicationsOverTimeData.map((d) => d.date);
  const applicationsTimeCounts = applicationsOverTimeData.map((d) => d.count);

  const topCompaniesData = charts.topCompanies || [];
  const topCompaniesLabels = topCompaniesData.map((c) => c.name);
  const topCompaniesCounts = topCompaniesData.map((c) => c.count);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { ticks: { maxTicksLimit: 10 } },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const verticalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { ticks: { maxTicksLimit: 8 } },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="card p-6">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse border border-gray-200 bg-gray-100" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse border border-gray-200 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="card p-6">
          <h1 className="text-3xl font-bold">{t('admin.reports.title') || 'Reports & Statistics'}</h1>
        </div>
        <div className="card flex flex-col items-center justify-center border border-gray-200 p-10 text-center">
          <FiAlertCircle className="h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm text-gray-600">{error}</p>
          <button
            type="button"
            onClick={fetchReports}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <FiRefreshCw className="h-4 w-4" />
            {t('admin.reports.refresh') || 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.reports.title') || 'Reports & Statistics'}</h1>
          <p className="text-gray-600 mt-2">{t('admin.reports.subtitle') || 'View platform-wide insights and performance metrics for company and job activity.'}</p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          {t('admin.reports.refresh') || 'Refresh'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric) => (
          <div key={metric.label} className="card flex items-center gap-4 p-5 border border-gray-200 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${metric.color}`}>{metric.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`${t('admin.reports.applicationsByStatus') || 'Applications by Status'} (${summary.totalApplications ?? 0})`}
          emptyText={t('admin.reports.noApplications') || 'No applications yet'}
          children={
            statusLabels.length > 0
              ? (
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: statusLabels,
                      datasets: [{
                        data: statusCounts,
                        backgroundColor: statusLabels.map((_, i) => PALETTE[i % PALETTE.length]),
                        borderWidth: 1,
                      }],
                    }}
                    options={doughnutOptions}
                  />
                </div>
              )
              : null
          }
        />

        <ChartCard
          title={t('admin.reports.jobsByCategory') || 'Jobs by Category'}
          emptyText={t('admin.reports.noJobs') || 'No jobs yet'}
          children={
            categoryLabels.length > 0
              ? (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: categoryLabels,
                      datasets: [{
                        label: 'Jobs',
                        data: categoryCounts,
                        backgroundColor: 'rgba(5, 150, 105, 0.75)',
                        borderColor: '#059669',
                        borderWidth: 1,
                      }],
                    }}
                    options={barOptions}
                  />
                </div>
              )
              : null
          }
        />

        <ChartCard
          title={t('admin.reports.jobsOverTime') || 'Jobs Posted (Last 30 Days)'}
          emptyText={t('admin.reports.noJobs') || 'No jobs yet'}
          children={
            jobsTimeLabels.length > 0
              ? (
                <div className="h-64">
                  <Line
                    data={{
                      labels: jobsTimeLabels,
                      datasets: [{
                        label: t('admin.reports.activeJobs') || 'Jobs',
                        data: jobsTimeCounts,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.15)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2,
                      }],
                    }}
                    options={lineOptions}
                  />
                </div>
              )
              : null
          }
        />

        <ChartCard
          title={t('admin.reports.applicationsOverTime') || 'Applications (Last 30 Days)'}
          emptyText={t('admin.reports.noApplications') || 'No applications yet'}
          children={
            applicationsTimeLabels.length > 0
              ? (
                <div className="h-64">
                  <Line
                    data={{
                      labels: applicationsTimeLabels,
                      datasets: [{
                        label: t('admin.reports.totalApplications') || 'Applications',
                        data: applicationsTimeCounts,
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(217, 119, 6, 0.15)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2,
                      }],
                    }}
                    options={lineOptions}
                  />
                </div>
              )
              : null
          }
        />

        <ChartCard
          title={t('admin.reports.topCompanies') || 'Top Companies by Applications'}
          emptyText={`${t('admin.reports.noApplications') || 'No applications yet'} · ${t('admin.reports.noCompanies') || 'No companies yet'}`}
          children={
            topCompaniesLabels.length > 0
              ? (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: topCompaniesLabels,
                      datasets: [{
                        label: 'Applications',
                        data: topCompaniesCounts,
                        backgroundColor: topCompaniesLabels.map((_, i) => PALETTE[i % PALETTE.length]),
                        borderWidth: 1,
                      }],
                    }}
                    options={verticalBarOptions}
                  />
                </div>
              )
              : null
          }
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <FiTrendingUp className="h-4 w-4" />
        <FiBarChart2 className="h-4 w-4" />
        <FiPieChart className="h-4 w-4" />
        {t('admin.reports.subtitle') || 'View platform-wide insights and performance metrics for company and job activity.'}
      </div>
    </div>
  );
};

export default AdminReports;