import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const StatCard = ({ label, value }) => (
  <div className="card p-4 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

const EmployerDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/employer/dashboard');
        if (mounted) setData(res.data);
      } catch (err) {
        // error handled by interceptor
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  if (loading) return <div className="p-6">{t('common.loading')}</div>;
  if (!data) return <div className="p-6">{t('dashboard.noDataAvailable') || 'No data available.'}</div>;

  const {
    totalJobs,
    activeJobs,
    closedJobs,
    totalApplicants,
    recentApplicants,
    applicantsByJob,
    upcomingInterviews,
    recentNotifications,
  } = data;

  return (
    <main className="page-container py-6">
      <h2 className="heading-2 mb-4">{t('nav.dashboard')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('employer.dashboard.jobsPosted') || 'Jobs Posted'} value={totalJobs} />
        <StatCard label={t('employer.dashboard.activePositions') || 'Active Positions'} value={activeJobs} />
        <StatCard label={t('employer.dashboard.closedPositions') || 'Closed Positions'} value={closedJobs} />
        <StatCard label={t('employer.dashboard.totalApplicants') || 'Total Applicants'} value={totalApplicants} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="card p-4">
          <h4 className="font-semibold mb-2">{t('employer.dashboard.recentApplicants') || 'Recent Applicants'}</h4>
          {recentApplicants.length ? (
            <ul className="space-y-2">
              {recentApplicants.map((a) => (
                <li key={a._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.applicant?.name || a.applicant?.email}</div>
                    <div className="text-sm text-gray-500">{t('employer.dashboard.appliedTo') || 'Applied to:'} {a.job?.title}</div>
                  </div>
                  <div className="text-sm text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">{t('employer.dashboard.noRecentApplicants') || 'No recent applicants.'}</div>
          )}
        </section>

        <section className="card p-4">
          <h4 className="font-semibold mb-2">{t('employer.dashboard.applicantsByJob') || 'Applicants By Job'}</h4>
          {applicantsByJob.length ? (
            <ul className="space-y-2">
              {applicantsByJob.map((j) => (
                <li key={j.jobId} className="flex items-center justify-between">
                  <div className="truncate">{j.title}</div>
                  <div className="text-sm text-gray-600">{j.count}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">{t('employer.dashboard.noApplicantsYet') || 'No applicants yet.'}</div>
          )}
        </section>

        <section className="card p-4">
          <h4 className="font-semibold mb-2">{t('dashboard.upcomingInterviews')}</h4>
          {upcomingInterviews.length ? (
            <ul className="space-y-2 text-sm">
              {upcomingInterviews.map((i) => (
                <li key={i._id}>
                  <div className="font-medium">{i.title || t('sidebar.interviews')}</div>
                  <div className="text-gray-500">{new Date(i.date).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">{t('employer.dashboard.noScheduledInterviews') || 'No scheduled interviews.'}</div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <section className="card p-4">
          <h4 className="font-semibold mb-2">{t('dashboard.notifications') || 'Notifications'}</h4>
          {recentNotifications.length ? (
            <ul className="space-y-2 text-sm">
              {recentNotifications.map((n) => (
                <li key={n._id} className="border-b pb-2">
                  <div className="text-gray-800">{n.title || n.message}</div>
                  <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">{t('dashboard.noNotificationsYet') || 'No notifications.'}</div>
          )}
        </section>

        <section className="card p-4">
          <h4 className="font-semibold mb-2">{t('nav.messages')}</h4>
          <div className="text-sm text-gray-500">{t('dashboard.messagesPlaceholder') || 'Messages UI'}</div>
        </section>
      </div>
    </main>
  );
};

export default EmployerDashboard;
