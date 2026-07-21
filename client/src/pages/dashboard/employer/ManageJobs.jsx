import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { FiEdit2, FiTrash2, FiEye, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageJobs = () => {
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
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter((j) => j._id !== id));
      toast.success('Job deleted successfully');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Jobs</h1>
        <Link to="/employer/post-job" className="btn btn-primary">Post New Job</Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No jobs posted yet.</p>
          <Link to="/employer/post-job" className="btn btn-primary">Post Your First Job</Link>
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
                    <span className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {job.status}
                    </span>
                    <span>{job.applicantsCount || 0} applicants</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/employer/applicants/${job._id}`} className="btn btn-outline inline-flex items-center gap-2" title="View Applicants">
                    <FiUsers /> Applicants
                  </Link>
                  <Link to={`/jobs/${job._id}`} className="btn btn-ghost" title="View">
                    <FiEye />
                  </Link>
                  <button className="btn btn-ghost" title="Edit">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(job._id)} className="btn btn-ghost text-red-500" title="Delete">
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
