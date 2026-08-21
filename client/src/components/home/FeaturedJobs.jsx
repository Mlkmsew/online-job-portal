import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const FeaturedJobs = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/jobs', { params: { isFeatured: 'true', limit: 6 } });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setJobs(data);
      } catch {
        setJobs([]);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <div key={job._id} className="card border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                {t('home.featured', { defaultValue: 'Featured' })}
              </span>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.18em] text-gray-500">{job.type || t('home.fullTime', { defaultValue: 'Full-time' })}</div>
          </div>

          <div className="mt-5">
            <Link to={`/jobs/${job.slug || job._id}`} className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition">
              {job.title}
            </Link>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{job.company?.name || t('home.topEthiopianEmployer', { defaultValue: 'Top Ethiopian Employer' })}</p>
          </div>

          <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div>
              {typeof job.location === 'object'
                ? (job.location?.city ? `${job.location.city}, ${job.location.region}` : (job.location?.region || t('home.fallbackLocation', { defaultValue: 'Addis Ababa' })))
                : (job.location || t('home.fallbackLocation', { defaultValue: 'Addis Ababa' }))}
            </div>
            <div>{job.experienceLevel || t('home.midLevel', { defaultValue: 'Mid Level' })}</div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-500">{t('home.appliedCount', { count: job.applicantsCount || 84, defaultValue: '{{count}} applied' })}</div>
            <Link to={`/jobs/${job.slug || job._id}`} className="btn btn-outline px-4 py-2 text-sm">
              {t('common.apply', { defaultValue: 'Apply' })}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturedJobs;
