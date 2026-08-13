import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiBriefcase, FiBookmark, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const formatLocation = (loc, fallback) => {
  if (!loc) return fallback;
  if (typeof loc === 'object') {
    return [loc.city, loc.address || loc.region, loc.country].filter(Boolean).join(', ') || fallback;
  }
  return String(loc);
};

const formatSalary = (sal, t) => {
  if (!sal) return t('home.competitiveSalary');
  if (typeof sal === 'string') return sal.trim() || t('home.competitiveSalary');
  if (typeof sal === 'object') {
    if (sal.isNegotiable) return t('home.negotiableSalary');
    const curr = sal.currency || 'ETB';
    const period = sal.period ? `/${sal.period}` : '';
    if (sal.min && sal.max) return `${curr} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()}${period}`;
    if (sal.min) return `${curr} ${sal.min.toLocaleString()}+${period}`;
    if (sal.max) return `${t('home.upTo')} ${curr} ${sal.max.toLocaleString()}${period}`;
  }
  return t('home.competitiveSalary');
};

const LatestJobs = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const { isAuthenticated } = useSelector((state) => state.auth);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return t('home.recently');
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t('home.justNow');
    if (hours < 24) return `${hours}${t('home.hoursAgo')}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}${t('home.daysAgo')}`;
    return `${Math.floor(days / 30)}${t('home.monthsAgo')}`;
  };

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/jobs', { params: { limit: 6 } });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setJobs(data);
      } catch {
        setJobs([]);
      }
    };
    fetchLatest();
  }, []);

  const toggleBookmark = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error(t('home.loginToBookmark'));
      return;
    }
    const isSaved = bookmarkedIds.has(jobId);
    try {
      if (isSaved) {
        await api.delete(`/bookmarks/${jobId}`);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        toast.success(t('home.removedFromBookmarks'));
      } else {
        await api.post('/bookmarks', { jobId });
        setBookmarkedIds((prev) => new Set(prev).add(jobId));
        toast.success(t('home.savedToBookmarks'));
      }
    } catch {
      toast.error(t('home.bookmarkFailed'));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => {
        const companyName = job.company?.name || t('home.ethiopianEmployer');
        const initial = companyName.charAt(0).toUpperCase();
        const isSaved = bookmarkedIds.has(job._id);

        return (
          <div
            key={job._id}
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5"
          >
            <div>
              {/* Header: Company Logo / Avatar & Bookmark */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-700 font-extrabold text-lg shadow-2xs border border-emerald-200/60 overflow-hidden">
                    {job.company?.logo ? (
                      <img src={job.company.logo} alt={companyName} className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 truncate max-w-[140px]">{companyName}</h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                      <FiBriefcase className="h-3 w-3" />
                      {job.type || t('home.fullTime')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => toggleBookmark(e, job._id)}
                  className={`rounded-xl p-2.5 transition-all ${
                    isSaved
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-emerald-600'
                  }`}
                  title={isSaved ? t('home.removeBookmark') : t('home.bookmarkJob')}
                >
                  <FiBookmark className={`h-4 w-4 ${isSaved ? 'fill-emerald-600' : ''}`} />
                </button>
              </div>

              {/* Title & Details */}
              <div className="mt-4 space-y-1.5">
                <Link
                  to={`/jobs/${job.slug || job._id}`}
                  className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition line-clamp-1"
                >
                  {job.title || t('home.jobPosition')}
                </Link>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 truncate max-w-[160px]">
                    <FiMapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {formatLocation(job.location, t('home.defaultLocation'))}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <FiClock className="h-3.5 w-3.5 text-slate-400" />
                    {formatTimeAgo(job.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700">
                {formatSalary(job.salary, t)}
              </span>
              <Link
                to={`/jobs/${job.slug || job._id}`}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-4 py-2 text-xs font-bold transition-all shadow-2xs"
              >
                <span>{t('jobs.viewDetails')}</span>
                <FiChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LatestJobs;
