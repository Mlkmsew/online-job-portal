import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { logout } from '../../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  FiArrowRight,
  FiAward,
  FiBell,
  FiBookOpen,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPlusCircle,
  FiSearch,
  FiTarget,
  FiUser,
  FiZap,
} from 'react-icons/fi';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [jobAlerts, setJobAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, appsRes, bookmarksRes, alertsRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/applications/my'),
        api.get('/bookmarks'),
        api.get('/job-alerts'),
      ]);

      const dashboardPayload = dashboardRes.data?.data || {};
      const normalizedApps = Array.isArray(appsRes.data?.data) ? appsRes.data.data : Array.isArray(appsRes.data) ? appsRes.data : [];
      const normalizedBookmarks = Array.isArray(bookmarksRes.data?.data) ? bookmarksRes.data.data : Array.isArray(bookmarksRes.data) ? bookmarksRes.data : [];
      const normalizedAlerts = Array.isArray(alertsRes.data?.data) ? alertsRes.data.data : Array.isArray(alertsRes.data) ? alertsRes.data : [];

      setDashboardData(dashboardPayload);
      setApplications(normalizedApps);
      setBookmarks(normalizedBookmarks);
      setJobAlerts(normalizedAlerts);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err.response?.status, err.response?.data || err.message || err);
      toast.error('We could not load your dashboard data right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user?.cv) {
      fetchDashboardData();
    }
  }, [user?.cv]);

  const normalizedApplications = useMemo(() => applications || [], [applications]);
  const normalizedBookmarks = useMemo(() => bookmarks || [], [bookmarks]);
  const profileViews = Number(dashboardData?.profileViews ?? user?.profileViews ?? 0);
  const recommendedJobs = useMemo(() => {
    const sourceJobs = Array.isArray(dashboardData?.recommendedJobs)
      ? dashboardData.recommendedJobs
      : Array.isArray(dashboardData?.jobs)
        ? dashboardData.jobs
        : [];
    return sourceJobs.slice(0, 4);
  }, [dashboardData]);

  const latestOpportunities = useMemo(() => {
    const sourceJobs = Array.isArray(dashboardData?.jobs)
      ? dashboardData.jobs
      : Array.isArray(dashboardData?.dashboardJobs)
        ? dashboardData.dashboardJobs
        : [];
    return sourceJobs.slice(0, 3);
  }, [dashboardData]);

  const hasApprovedJobs = useMemo(() => {
    const sources = [dashboardData?.recommendedJobs, dashboardData?.jobs, dashboardData?.dashboardJobs, dashboardData?.entryJobs];
    return sources.some((value) => Array.isArray(value) && value.length > 0);
  }, [dashboardData]);

  const recentApplications = useMemo(() => {
    const fromDashboard = Array.isArray(dashboardData?.recentApplications) ? dashboardData.recentApplications : [];
    if (fromDashboard.length) return fromDashboard.slice(0, 4);
    return normalizedApplications.slice(0, 4);
  }, [dashboardData, normalizedApplications]);

  const savedJobs = useMemo(() => {
    const fromDashboard = Array.isArray(dashboardData?.savedJobs) ? dashboardData.savedJobs : [];
    if (fromDashboard.length) return fromDashboard.slice(0, 3);
    return normalizedBookmarks.slice(0, 3);
  }, [dashboardData, normalizedBookmarks]);

  const profileCompleteness = useMemo(() => {
    const completed = [
      Boolean(user?.firstName && user?.lastName && user?.email),
      Boolean(user?.headline),
      Boolean(Array.isArray(user?.skills) && user.skills.length > 0),
      Boolean(user?.bio),
      Boolean(user?.cv || dashboardData?.resume?.hasCV),
    ].filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  }, [dashboardData, user]);

  const unreadMessages = Number(dashboardData?.unreadMessages || 0);
  const unreadNotifications = Number(dashboardData?.unreadNotifications || 0);
  const resumeHasCV = Boolean(dashboardData?.resume?.hasCV || user?.cv);

  const applicationCounts = useMemo(() => {
    const normalizedStatus = (status) => `${status || ''}`.trim().toLowerCase();
    const activeCount = normalizedApplications.filter((app) => {
      const status = normalizedStatus(app.status);
      return ['submitted', 'reviewed', 'pending', 'under review'].includes(status);
    }).length;

    const interviewCount = normalizedApplications.filter((app) => {
      const status = normalizedStatus(app.status);
      return ['interview scheduled', 'interview', 'scheduled interview'].includes(status);
    }).length;

    const shortlistedCount = normalizedApplications.filter((app) => {
      const status = normalizedStatus(app.status);
      return ['shortlisted'].includes(status);
    }).length;

    const offerCount = normalizedApplications.filter((app) => {
      const status = normalizedStatus(app.status);
      return ['offer', 'accepted', 'hired', 'selected'].includes(status);
    }).length;

    const archivedCount = normalizedApplications.filter((app) => {
      const status = normalizedStatus(app.status);
      return ['rejected', 'not selected', 'declined'].includes(status);
    }).length;

    return {
      activeCount,
      interviewCount,
      shortlistedCount,
      offerCount,
      archivedCount,
    };
  }, [normalizedApplications]);

  const profileSections = useMemo(() => [
    {
      label: 'Personal Information',
      completed: Boolean(user?.firstName && user?.lastName && user?.email),
    },
    {
      label: 'Education',
      completed: Boolean(user?.education?.length || user?.resumeAnalysis?.education?.length),
    },
    {
      label: 'Skills',
      completed: Boolean((user?.skills?.length || user?.resumeAnalysis?.skills?.length) && (user?.skills?.length || user?.resumeAnalysis?.skills?.length) > 0),
    },
    {
      label: 'Work Experience',
      completed: Boolean(user?.resumeAnalysis?.experienceYears || user?.experience?.length || user?.workExperience?.length),
    },
    {
      label: 'CV Upload',
      completed: resumeHasCV,
    },
  ], [resumeHasCV, user]);

  const completionPercentage = useMemo(() => {
    const completed = profileSections.filter((section) => section.completed).length;
    return Math.round((completed / profileSections.length) * 100);
  }, [profileSections]);

  const skillGapSummary = useMemo(() => {
    const currentSkills = [
      ...(Array.isArray(user?.skills) ? user.skills : []),
      ...(Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : []),
    ]
      .map((skill) => (typeof skill === 'string' ? skill : skill?.name || ''))
      .filter(Boolean)
      .slice(0, 5);

    const missingSkills = Array.isArray(recommendedJobs?.[0]?.matchDetails?.missingSkills)
      ? recommendedJobs[0].matchDetails.missingSkills.slice(0, 4)
      : [];

    return {
      currentSkills,
      missingSkills,
    };
  }, [recommendedJobs, user]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      navigate('/dashboard/find-jobs');
      return;
    }
    navigate(`/dashboard/find-jobs?search=${encodeURIComponent(term)}`);
  };

  const handleBookmark = async (jobId) => {
    try {
      await api.post('/bookmarks', { job: jobId });
      toast.success('Saved to your jobs list.');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save this job right now.');
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getMatchBadgeClass = (score) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700';
    if (score >= 70) return 'bg-teal-50 text-teal-700';
    if (score >= 50) return 'bg-amber-50 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusBadgeClass = (status) => {
    const normalized = `${status || ''}`.trim().toLowerCase();
    if (['interview scheduled', 'interview', 'scheduled interview'].includes(normalized)) {
      return 'bg-amber-50 text-amber-700';
    }
    if (['shortlisted'].includes(normalized)) {
      return 'bg-sky-50 text-sky-700';
    }
    if (['accepted', 'selected', 'hired', 'offer'].includes(normalized)) {
      return 'bg-emerald-50 text-emerald-700';
    }
    if (['rejected', 'not selected', 'declined'].includes(normalized)) {
      return 'bg-rose-50 text-rose-700';
    }
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const normalized = `${status || ''}`.trim().toLowerCase();
    if (['submitted', 'reviewed', 'pending', 'under review'].includes(normalized)) return 'Under Review';
    if (['interview scheduled', 'interview', 'scheduled interview'].includes(normalized)) return 'Interview';
    if (['shortlisted'].includes(normalized)) return 'Shortlisted';
    if (['accepted', 'selected', 'hired', 'offer'].includes(normalized)) return 'Accepted';
    if (['rejected', 'not selected', 'declined'].includes(normalized)) return 'Rejected';
    return 'Under Review';
  };

  const formatDate = (value) => {
    if (!value) return 'Recently updated';
    try {
      return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently updated';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {user?.firstName || 'there'}!</h1>
            <p className="mt-2 text-sm text-slate-600">Here is what’s happening with your job search today.</p>
          </div>
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search jobs, companies, skills..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </form>
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowNotifications((s) => !s); setShowMessages(false); setShowProfileMenu(false); }}
                className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm"
              >
                <FiBell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                  <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
                  <div className="mt-2 max-h-48 overflow-auto">
                    {jobAlerts.length === 0 ? (
                      <div className="py-3 text-sm text-slate-500">No notifications</div>
                    ) : (
                      jobAlerts.slice(0, 5).map((alert) => (
                        <div key={alert._id} className="flex items-start gap-2 border-b border-slate-100 py-2 last:border-b-0">
                          <FiBell className="h-4 w-4 text-emerald-600" />
                          <div className="text-sm">
                            <div className="font-semibold text-slate-800">{alert.title || 'New job match'}</div>
                            <div className="text-slate-500">{alert.description || ''}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 text-right">
                    <Link to="/dashboard/job-alerts" className="text-sm font-semibold text-emerald-700">View all</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowMessages((s) => !s); setShowNotifications(false); setShowProfileMenu(false); }}
                className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm"
              >
                <FiMail className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadMessages}
                  </span>
                )}
              </button>

              {showMessages && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                  <h4 className="text-sm font-semibold text-slate-800">Messages</h4>
                  <div className="mt-2 text-sm text-slate-500">Open your messages inbox to view conversations.</div>
                  <div className="mt-3 text-right">
                    <Link to="/dashboard/messages" className="text-sm font-semibold text-emerald-700">Open Inbox</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowProfileMenu((s) => !s); setShowNotifications(false); setShowMessages(false); }}
                className="flex items-center gap-2"
              >
                <div className="h-9 w-9 overflow-hidden rounded-full bg-emerald-100">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.firstName || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-semibold text-emerald-700">
                      {(user?.firstName || 'U').charAt(0)}{(user?.lastName || 'S').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user?.firstName || 'User'}</p>
                  <p className="text-xs text-slate-500">Job Seeker</p>
                </div>
                <FiChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); navigate('/dashboard/profile'); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiUser className="h-4 w-4" /> View profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); navigate('/dashboard/resume'); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiFileText className="h-4 w-4" /> Upload new CV
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); navigate('/dashboard/settings'); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiBriefcase className="h-4 w-4" /> Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <FiArrowRight className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Applications', value: normalizedApplications.length, icon: FiFileText, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Profile Views', value: profileViews, icon: FiBriefcase, tone: 'bg-violet-50 text-violet-700' },
          { label: 'Saved Jobs', value: normalizedBookmarks.length, icon: FiBookmark, tone: 'bg-sky-50 text-sky-700' },
          { label: 'Job Alerts', value: jobAlerts.length, icon: FiBell, tone: 'bg-amber-50 text-amber-700' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl bg-emerald-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-100/80">Don’t have a professional CV?</p>
            <h2 className="mt-2 text-2xl font-semibold">Create or upload your CV to increase your chances of getting hired.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/profile')}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm"
            >
              Upload CV
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/resume')}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
            >
              Create CV Now
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recommended Jobs</h2>
            <p className="text-sm text-slate-500">Jobs matched to your profile and skills.</p>
          </div>
          <Link to="/dashboard/find-jobs" className="text-sm font-semibold text-emerald-700 hover:underline">View All</Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recommendedJobs.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No recommended jobs available yet.
            </div>
          ) : (
            recommendedJobs.map((job) => (
              <div key={job._id} className="rounded-3xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{job.company?.name || 'Company'}</p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">{job.title || 'Job title'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookmark(job._id)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <FiBookmark className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{job.location?.city || job.location?.region || 'Remote'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{job.jobType || 'Full-time'}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{job.matchPercentage ?? 0}% match</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Latest Opportunities</h2>
            <p className="text-sm text-slate-500">Fresh jobs posted recently for your skill set.</p>
          </div>
          <Link to="/dashboard/find-jobs" className="text-sm font-semibold text-emerald-700 hover:underline">View All Jobs</Link>
        </div>

        <div className="mt-5 space-y-3">
          {latestOpportunities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No new job opportunities available right now.
            </div>
          ) : (
            latestOpportunities.map((job) => (
              <div key={job._id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{job.title || 'Job title'}</p>
                  <p className="text-sm text-slate-500">{job.company?.name || 'Company'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{job.location?.city || job.location?.region || 'Remote'}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{job.jobType || 'Full-time'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Apply Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBookmark(job._id)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/dashboard/find-jobs" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            Browse More Jobs
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
