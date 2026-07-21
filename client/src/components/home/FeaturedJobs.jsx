import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const FeaturedJobs = () => {
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
                Featured
              </span>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.18em] text-gray-500">{job.type || 'Full-time'}</div>
          </div>

          <div className="mt-5">
            <Link to={`/jobs/${job.slug || job._id}`} className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition">
              {job.title}
            </Link>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{job.company?.name || 'Top Ethiopian Employer'}</p>
          </div>

          <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div>
              {typeof job.location === 'object'
                ? (job.location?.city ? `${job.location.city}, ${job.location.region}` : (job.location?.region || 'Addis Ababa'))
                : (job.location || 'Addis Ababa')}
            </div>
            <div>{job.experienceLevel || 'Mid Level'}</div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-500">{job.applicantsCount ? `${job.applicantsCount} applied` : '84 applied'}</div>
            <Link to={`/jobs/${job.slug || job._id}`} className="btn btn-outline px-4 py-2 text-sm">
              Apply
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturedJobs;
