import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { FiEdit2, FiTrash2, FiEye, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageJobs = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/my/posted');
      const jobsList = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setJobs(jobsList);
    } catch (error) {
      toast.error(t('employer.manageJobs.loadFailed') || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('employer.manageJobs.confirmDelete') || 'Are you sure you want to delete this job?')) return;

    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter((j) => j._id !== id));
      toast.success(t('employer.manageJobs.deletedSuccess') || 'Job deleted successfully');
    } catch (error) {
      toast.error(t('employer.manageJobs.deleteFailed') || 'Failed to delete job');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('sidebar.manageJobs')}</h1>
        <Link to="/employer/post-job" className="btn btn-primary">{t('sidebar.postJob')}</Link>
      </div>

      {loading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">{t('employer.manageJobs.noJobs') || 'No jobs posted yet.'}</p>
          <Link to="/employer/post-job" className="btn btn-primary">{t('sidebar.postJob')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                  <p className="text-gray-600 mb-2">{job.location?.region}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`badge ${
                      job.status === 'published' || job.isApproved
                        ? 'badge-success'
                        : job.status === 'pending'
                        ? 'badge-warning'
                        : 'badge-error'
                    }`}>
                      {job.status === 'published' || job.isApproved
                        ? (t('employer.manageJobs.published') || 'Published')
                        : job.status === 'pending'
                        ? (t('dashboard.status.underReview') || 'Pending Review')
                        : job.status}
                    </span>
                    <span>{job.applicantsCount || 0} {t('sidebar.applicants')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/employer/applicants/${job._id}`} className="btn btn-outline inline-flex items-center gap-2" title={t('sidebar.applicants')}>
                    <FiUsers />{t('sidebar.applicants')}
                  </Link>
                  <Link to={`/jobs/${job._id}`} className="btn btn-ghost" title={t('common.view')}>
                    <FiEye />
                  </Link>
                  <Link to={`/employer/post-job/${job._id}`} className="btn btn-ghost inline-flex items-center gap-2" title={t('common.edit')}>
                    <FiEdit2 />
                  </Link>
                  <button onClick={() => handleDelete(job._id)} className="btn btn-ghost text-red-500" title={t('common.delete')}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageJobs;

