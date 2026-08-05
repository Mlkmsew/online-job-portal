import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../services/api';
import { FiMapPin, FiBriefcase, FiTrash2, FiClock, FiZap, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SavedJobs = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data?.data || res.data || []);
    } catch (error) {
      toast.error('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(bookmarks.filter((b) => b._id !== id));
      toast.success('Job removed from saved');
    } catch (error) {
      toast.error('Failed to remove job');
    }
  };

  // Helper to format days remaining
  const getDeadlineText = (deadlineDate) => {
    if (!deadlineDate) return 'No deadline specified';
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Closed';
    if (diffDays === 0) return 'Closes today';
    if (diffDays === 1) return 'Closes tomorrow';
    return `Closes in ${diffDays} days`;
  };

  const handleQuickApply = async (jobId) => {
    if (!user?.cv) {
      toast.error('Please build or upload a resume in the Profile/Resume tab first!', {
        duration: 4000,
      });
      return;
    }

    const loadToast = toast.loading('Submitting your quick application...');
    try {
      await api.post('/applications', {
        job: jobId,
        useProfileCV: true,
        coverLetter: 'Quick Applied via Saved Jobs.',
      });
      toast.success('Quick Applied successfully!', { id: loadToast });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Quick Apply failed. You might have already applied.', {
        id: loadToast,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <h1 className="text-3xl font-black mb-8 text-slate-900 dark:text-white">Saved Jobs</h1>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="card text-center py-16 px-6 border-dashed border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-slate-900">
          <FiBriefcase className="w-16 h-16 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No saved jobs yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto mb-6">
            Bookmark jobs while browsing to keep them handy and apply later.
          </p>
          <Link to="/jobs" className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookmarks.map((bookmark) => {
            const job = bookmark.job;
            if (!job) return null;

            const daysLeft = job.applicationDeadline ? Math.ceil((new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
            const deadlineBadgeColor = daysLeft <= 3 ? 'bg-red-50 text-red-700 border-red-150' : 'bg-amber-50 text-amber-700 border-amber-150';

            // Placeholder AI score calculation or default display
            const mockAIScore = 85 + (job.title.length % 15); 

            return (
              <div key={bookmark._id} className="card p-6 shadow-sm border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                <div>
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-teal-600 transition">
                        <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                      </h3>
                      <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-0.5">{job.company?.name || 'Company'}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(bookmark._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                      title="Remove Bookmark"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Details Row */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-4 mb-4">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="text-gray-400" />
                      {job.location?.city ? `${job.location.city}, ` : ''}{job.location?.region || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiBriefcase className="text-gray-400" />
                      {job.jobType}
                    </span>
                  </div>

                  {/* Badges: Deadline & AI Match Placeholder */}
                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${deadlineBadgeColor}`}>
                      <FiClock className="w-3 h-3" />
                      {getDeadlineText(job.applicationDeadline)}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-200/30 flex items-center gap-1">
                      <FiZap className="w-3 h-3" />
                      AI Match: {mockAIScore}%
                    </span>
                  </div>
                </div>

                {/* Apply Actions */}
                <div className="flex items-center gap-3 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={() => handleQuickApply(job._id)}
                    className="flex-1 btn btn-primary bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-sm shadow"
                  >
                    Quick Apply
                  </button>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="flex-1 btn btn-outline border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-2.5 px-4 rounded-xl text-center text-sm font-bold"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
