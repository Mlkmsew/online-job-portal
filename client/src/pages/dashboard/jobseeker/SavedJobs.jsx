import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { FiMapPin, FiBriefcase, FiTrash2, FiClock, FiZap, FiAward, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getPreferredBuilderResume, buildResumePdf } from '../../../utils/builderResumePdf';

const SavedJobs = () => {
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarks();
    fetchAppliedJobs();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data?.data || res.data || []);
    } catch (error) {
      toast.error(t('savedJobs.loadFailed') || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const res = await api.get('/applications/my');
      const ids = (res.data?.data || []).map((a) => a.job?._id || a.job);
      setAppliedJobIds(new Set(ids.filter(Boolean)));
    } catch {
      // Non-blocking: Quick Apply still works even if we cannot prefetch state.
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(bookmarks.filter((b) => b._id !== id));
      toast.success(t('savedJobs.removedSuccess') || 'Job removed from saved');
    } catch (error) {
      toast.error(t('savedJobs.removeFailed') || 'Failed to remove job');
    }
  };

  // Helper to format days remaining
  const getDeadlineText = (deadlineDate) => {
    if (!deadlineDate) return t('jobs.any', { defaultValue: '' });
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return t('jobs.expired', { defaultValue: 'Expired' });
    if (diffDays === 0) return t('jobs.closesToday', { defaultValue: 'Closes today' });
    if (diffDays === 1) return t('jobs.closesTomorrow', { defaultValue: 'Closes tomorrow' });
    return t('jobs.closesInDays', { count: diffDays, defaultValue: `Closes in ${diffDays} days` });
  };

  const handleQuickApply = async (jobId, job) => {
    if (applyingId) return;

    if (appliedJobIds.has(jobId)) {
      toast(t('savedJobs.alreadyApplied') || 'You have already applied for this job.');
      return;
    }

    // Employer-required application fields can't be auto-filled by Quick Apply.
    // Send the user to the full application form so they can complete them.
    const requiredFields = Array.isArray(job?.applicationFields)
      ? job.applicationFields.filter((field) => field?.required)
      : [];
    if (requiredFields.length > 0) {
      toast(t('savedJobs.needsFullApply') || 'This job requires additional information. Redirecting to the application form…');
      navigate(`/jobs/${jobId}/apply`);
      return;
    }

    // A resume is available if the user uploaded a CV (user.cv) or built one
    // in the Resume Builder. Without either, Quick Apply cannot attach a resume.
    const hasUploadedCV = Boolean(user?.cv);
    const builtResume = hasUploadedCV ? null : getPreferredBuilderResume(user?._id || user?.id);

    if (!hasUploadedCV && !builtResume) {
      toast.error(t('savedJobs.resumeRequired') || 'Please build or upload a resume in the Profile/Resume tab first!', {
        duration: 4000,
      });
      return;
    }

    setApplyingId(jobId);
    const loadToast = toast.loading(t('savedJobs.submitting') || 'Submitting your quick application...');
    try {
      let response;
      if (hasUploadedCV) {
        response = await api.post(
          '/applications',
          {
            job: jobId,
            useProfileCV: true,
            coverLetter: t('savedJobs.quickApplyCover', { defaultValue: 'Quick Applied via Saved Jobs.' }),
          },
          { skipGlobalErrorToast: true }
        );
      } else {
        const pdf = buildResumePdf(builtResume);
        const formData = new FormData();
        formData.append('job', jobId);
        formData.append('coverLetter', t('savedJobs.quickApplyCover', { defaultValue: 'Quick Applied via Saved Jobs.' }));
        formData.append('useProfileCV', 'false');
        formData.append('resume', pdf);
        response = await api.post('/applications', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipGlobalErrorToast: true,
        });
      }
      setAppliedJobIds((prev) => new Set(prev).add(jobId));
      toast.success(t('savedJobs.appliedSuccess') || 'Quick Applied successfully!', { id: loadToast });
    } catch (error) {
      const message =
        error.response?.data?.message || t('savedJobs.applyFailed') || 'Quick Apply failed.';
      if (/already applied/i.test(message)) {
        setAppliedJobIds((prev) => new Set(prev).add(jobId));
      }
      toast.error(message, { id: loadToast });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <h1 className="text-3xl font-black mb-8 text-slate-900 dark:text-white">{t('dashboard.savedJobs')}</h1>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="card text-center py-16 px-6 border-dashed border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-slate-900">
          <FiBriefcase className="w-16 h-16 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('savedJobs.emptyTitle') || 'No saved jobs yet'}</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto mb-6">
            {t('savedJobs.emptySubtitle') || 'Bookmark jobs while browsing to keep them handy and apply later.'}
          </p>
          <Link to="/jobs" className="inline-flex items-center justify-center rounded-xl bg-[#1769E0] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0D5BC4]">
            {t('savedJobs.browseOpportunities') || 'Browse Opportunities'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookmarks.map((bookmark) => {
            const job = bookmark.job;
            if (!job) return null;

            const daysLeft = job.applicationDeadline ? Math.ceil((new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
            const deadlineBadgeColor = daysLeft <= 3 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200';

            const mockAIScore = 85 + (job.title.length % 15); 

            return (
              <div key={bookmark._id} className="card p-6 shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                <div>
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-[var(--primary)] transition">
                        <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                      </h3>
                      <p className="text-sm font-semibold text-[var(--primary)] mt-0.5">{job.company?.name || t('dashboard.jobCard.company')}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(bookmark._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                      title={t('savedJobs.removeBookmark') || 'Remove Bookmark'}
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Details Row */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-4 mb-4">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="text-gray-400" />
                      {job.location?.city ? `${job.location.city}, ` : ''}{job.location?.region || t('dashboard.jobCard.remote')}
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
                      {t('savedJobs.aiMatch', { score: mockAIScore, defaultValue: `AI Match: ${mockAIScore}%` })}
                    </span>
                  </div>
                </div>

                {/* Apply Actions */}
                <div className="flex items-center gap-3 pt-4 border-t dark:border-gray-700">
                  {appliedJobIds.has(job._id) ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--primary)]/10 text-[var(--primary)] font-bold py-2.5 px-4 rounded-xl text-center text-sm cursor-default"
                    >
                      <FiCheck className="w-4 h-4" />
                      {t('savedJobs.applied') || 'Applied'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickApply(job._id, job)}
                      disabled={applyingId === job._id}
                      className={`flex-1 btn btn-primary bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-2.5 px-4 rounded-xl text-center text-sm shadow ${applyingId === job._id ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {applyingId === job._id
                        ? (t('savedJobs.applying') || 'Applying...')
                        : (t('savedJobs.quickApply') || 'Quick Apply')}
                    </button>
                  )}
                  <Link
                    to={`/jobs/${job._id}`}
                    className="flex-1 btn btn-outline border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 py-2.5 px-4 rounded-xl text-center text-sm font-bold"
                  >
                    {t('jobs.viewDetails')}
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

