import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  if (!stats) return <div className="p-8">{t('common.loading')}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{t('admin.dashboardTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3>{t('admin.totalUsers')}</h3>
          <p className="text-3xl font-bold">{stats.overview.totalUsers}</p>
        </div>
        <div className="card p-4">
          <h3>{t('admin.totalEmployers') || 'Total Employers'}</h3>
          <p className="text-3xl font-bold">{stats.overview.totalEmployers}</p>
        </div>
        <div className="card p-4">
          <h3>{t('admin.jobListings')}</h3>
          <p className="text-3xl font-bold">{stats.overview.totalJobs}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
