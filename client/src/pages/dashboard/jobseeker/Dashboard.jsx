import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import socketService from '../../../services/socket';
import { logout } from '../../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  FiArrowRight,
  FiAward,
  FiBell,
  FiBookOpen,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
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

const formatInterviewDate = (dateValue) => {
  if (!dateValue) return 'Date not set';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatInterviewTime = (dateValue) => {
  if (!dateValue) return 'Time not set';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Invalid time';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const JobSeekerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [jobAlerts, setJobAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [notificationCount, setNotificationCount] = useState(null);
  const [messageCount, setMessageCount] = useState(null);

  const isMounted = useRef(false);
  const lastFetchId = useRef(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchDashboardData = async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setErrorMessage(null);
    const fetchId = ++lastFetchId.current;

    try {
      const [dashboardRes, appsRes, bookmarksRes, alertsRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/applications/my'),
        api.get('/bookmarks'),
        api.get('/job-alerts'),
      ]);

      console.log('Dashboard API Response:', { dashboardRes, appsRes, bookmarksRes, alertsRes });
      console.log('Dashboard State Before:', { dashboardData, applications, bookmarks, jobAlerts });

      if (fetchId !== lastFetchId.current) {
        console.log('Discarding stale dashboard response', fetchId);
        return;
      }

      if (!isMounted.current) {
        return;
      }

      const normalizeArrayResponse = (response) => {
        if (response.status !== 'fulfilled') return null;
        if (Array.isArray(response.value.data?.data)) return response.value.data.data;
        if (Array.isArray(response.value.data)) return response.value.data;
        return null;
      };

      const normalizeDashboardResponse = (response) => {
        if (response.status !== 'fulfilled') return null;
        if (response.value?.data?.data !== undefined) return response.value.data.data;
        return null;
      };

      const dashboardPayload = normalizeDashboardResponse(dashboardRes);
      if (dashboardPayload !== null) {
        setDashboardData(dashboardPayload);
      } else if (dashboardRes.status === 'rejected') {
        console.error('Dashboard stats failed:', dashboardRes.reason);
        setErrorMessage('Unable to load dashboard overview.');
      }

      const normalizedApps = normalizeArrayResponse(appsRes);
      if (normalizedApps !== null) {
        setApplications(normalizedApps);
      } else {
        console.error('My applications request failed:', appsRes.reason);
      }

      const normalizedBookmarks = normalizeArrayResponse(bookmarksRes);
      if (normalizedBookmarks !== null) {
        setBookmarks(normalizedBookmarks);
      } else {
        console.error('Bookmarks request failed:', bookmarksRes.reason);
      }

      const normalizedAlerts = normalizeArrayResponse(alertsRes);
      if (normalizedAlerts !== null) {
        setJobAlerts(normalizedAlerts);
      } else {
        console.error('Job alerts request failed:', alertsRes.reason);
      }

      console.log('Dashboard State After:', { dashboardData, applications, bookmarks, jobAlerts });
    } catch (err) {
      console.error('Unexpected error fetching dashboard stats:', err);
      if (isMounted.current) {
        setErrorMessage('We could not load your dashboard data right now.');
      }
    } finally {
      if (fetchId === lastFetchId.current && isMounted.current) {
        if (initial) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchDashboardData(true);

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    if (user?.cv) {
      fetchDashboardData();
    }
  }, [user?.cv]);

  const fetchBadgeCounts = async () => {
    try {
      const [notificationRes, messageRes] = await Promise.all([
        api.get('/notifications/unread/count?excludeType=new_message'),
        api.get('/messages/unread/count'),
      ]);
      setNotificationCount(notificationRes.data?.count ?? 0);
      setMessageCount(messageRes.data?.count ?? 0);
    } catch (err) {
      console.error('Failed to load unread badge counts:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchBadgeCounts();
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = socketService.connect(token);
    socketService.on('notification', (notification) => {
      if (!notification) return;
      if (notification.type === 'new_message') {
        setMessageCount((prev) => (prev ?? 0) + 1);
      } else {
        setNotificationCount((prev) => (prev ?? 0) + 1);
      }
    });

    return () => {
      socketService.off('notification');
    };
  }, []);

  const markAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/read-all?excludeType=new_message');
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }

    setNotificationCount(0);
  };

  const handleBellClick = async () => {
    const nextVisibility = !showNotifications;
    setShowNotifications(nextVisibility);
    setShowMessages(false);
    setShowProfileMenu(false);

    if (nextVisibility) {
      await markAllNotificationsRead();
    }
  };

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

  const unreadMessages = messageCount !== null ? Number(messageCount) : Number(dashboardData?.unreadMessages || 0);
  const unreadNotifications = notificationCount !== null ? Number(notificationCount) : Number(dashboardData?.unreadNotifications || 0);
  const resumeHasCV = Boolean(dashboardData?.resume?.hasCV || user?.cv);
  const upcomingInterviews = Array.isArray(dashboardData?.upcomingInterviews) ? dashboardData.upcomingInterviews : [];

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

  const handleOpenInterview = (interviewId) => {
    if (!interviewId) return;
    navigate(`/dashboard/interviews/${interviewId}`);
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
    if (score >= 85) return 'bg-blue-50 text-blue-700';
    if (score >= 70) return 'bg-sky-50 text-sky-700';
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
      return 'bg-blue-50 text-blue-700';
    }
    if (['rejected', 'not selected', 'declined'].includes(normalized)) {
      return 'bg-rose-50 text-rose-700';
    }
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const normalized = `${status || ''}`.trim().toLowerCase();
    if (['submitted', 'reviewed', 'pending', 'under review'].includes(normalized)) return t('dashboard.status.underReview');
    if (['interview scheduled', 'interview', 'scheduled interview'].includes(normalized)) return t('dashboard.status.interview');
    if (['shortlisted'].includes(normalized)) return t('dashboard.status.shortlisted');
    if (['accepted', 'selected', 'hired', 'offer'].includes(normalized)) return t('dashboard.status.accepted');
    if (['rejected', 'not selected', 'declined'].includes(normalized)) return t('dashboard.status.rejected');
    return t('dashboard.status.underReview');
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
      {/* ── Welcome Header: Unified Theme ── */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.welcomeBack', { name: user?.firstName || t('common.user') || 'User' })}
          </h1>
          <p className="mt-1.5 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.welcomeSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              className="h-10 w-full rounded-full border px-11 text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </form>

          {/* Bell Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleBellClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border shadow-2xs transition hover:opacity-80"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              aria-label={t('dashboard.notifications.title')}
            >
              <FiBell className="h-4.5 w-4.5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.notifications.title')}</h4>
                  <Link to="/dashboard/job-alerts" className="text-xs font-semibold text-[#1769E0] dark:text-[#60A5FA] hover:underline">{t('dashboard.notifications.viewAll')}</Link>
                </div>
                <div className="mt-2 max-h-52 overflow-auto sidebar-scroll">
                  {jobAlerts.length === 0 ? (
                    <div className="py-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.notifications.noNotifications')}</div>
                  ) : (
                    jobAlerts.slice(0, 5).map((alert) => (
                      <div key={alert._id} className="flex items-start gap-2.5 border-b py-2.5 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1769E0]/10 dark:bg-[#60A5FA]/20 text-[#1769E0] dark:text-[#93C5FD]">
                          <FiBell className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-xs min-w-0 flex-1">
                          <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{alert.title || t('dashboard.notifications.newJobMatch')}</div>
                          <div className="line-clamp-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{alert.description || ''}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Messages Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowMessages((s) => !s); setShowNotifications(false); setShowProfileMenu(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border shadow-2xs transition hover:opacity-80"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              aria-label={t('dashboard.messages.title')}
            >
              <FiMail className="h-4.5 w-4.5" />
              {unreadMessages > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1769E0] dark:bg-[#60A5FA] px-1 text-[9px] font-bold text-white">
                  {unreadMessages}
                </span>
              )}
            </button>

            {showMessages && (
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border p-4 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.messages.title')}</h4>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.messages.subtitle')}</p>
                <div className="mt-3 pt-2 border-t text-right" style={{ borderColor: 'var(--border)' }}>
                  <Link to="/dashboard/messages" className="text-xs font-bold text-[#1769E0] dark:text-[#60A5FA] hover:underline">{t('dashboard.messages.openInbox')}</Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowProfileMenu((s) => !s); setShowNotifications(false); setShowMessages(false); }}
              className="flex items-center gap-2.5 rounded-full border px-3 py-1.5 shadow-2xs transition hover:opacity-80"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="h-7 w-7 overflow-hidden rounded-full bg-[#1769E0] dark:bg-[#60A5FA] text-white text-xs font-bold flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.firstName || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <span>{(user?.firstName || 'U').charAt(0)}{(user?.lastName || 'S').charAt(0)}</span>
                )}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>{user?.firstName || 'User'}</span>
              <FiChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-2xl border p-2 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); navigate('/dashboard/profile'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-[#172554]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <FiUser className="h-4 w-4 text-[#1769E0] dark:text-[#60A5FA]" /> {t('dashboard.userMenu.viewProfile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); navigate('/dashboard/resume'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-[#172554]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <FiFileText className="h-4 w-4 text-[#1769E0] dark:text-[#60A5FA]" /> {t('dashboard.userMenu.uploadNewCV')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); navigate('/dashboard/settings'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-[#172554]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <FiBriefcase className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} /> {t('dashboard.userMenu.settings')}
                  </button>
                  <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    <FiArrowRight className="h-4 w-4" /> {t('dashboard.userMenu.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>


      {/* ── Statistics Cards Grid — Unified Design ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t('dashboard.totalApplications'), value: normalizedApplications.length, icon: FiFileText, iconClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40' },
          { label: t('dashboard.profileViews'), value: profileViews, icon: FiBriefcase, iconClass: 'bg-[#1769E0]/10 dark:bg-[#60A5FA]/20 text-[#1769E0] dark:text-[#93C5FD] border border-[#1769E0]/20 dark:border-[#60A5FA]/30' },
          { label: t('dashboard.savedJobs'), value: normalizedBookmarks.length, icon: FiBookmark, iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40' },
          { label: t('dashboard.upcomingInterviews'), value: upcomingInterviews.length, icon: FiCalendar, iconClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── CV Promotion Banner — Unified Blue Theme ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] dark:bg-[#1e3a8a] p-6 text-white shadow-lg border border-[#1e3a8a]/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F3E5AB]">{t('dashboard.cvBanner.tagline')}</p>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-white leading-tight">
              {t('dashboard.cvBanner.title')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard/profile')}
              className="rounded-full bg-[#D9A441] px-5 py-2.5 text-xs font-bold text-[#14231F] shadow-md hover:bg-[#F0B85A] transition"
            >
              {t('dashboard.cvBanner.uploadCV')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/resume')}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              {t('dashboard.cvBanner.createCV')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Recommended Jobs Section ── */}
      <div className="rounded-2xl border p-6 shadow-xs transition" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.recommendedJobs.title')}</h2>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.recommendedJobs.subtitle')}</p>
          </div>
          <Link to="/dashboard/find-jobs" className="text-xs font-bold text-[#1769E0] dark:text-[#60A5FA] hover:underline">{t('dashboard.recommendedJobs.viewAllMatches')}</Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recommendedJobs.length === 0 ? (
            dashboardData?.profileComplete ? (
              <div className="col-span-full rounded-[20px] border border-dashed border-[#E4E7EC] bg-[#F8FAFC] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1769E0]/10 text-[#1769E0] mb-3">
                  <FiSearch className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-[#101828] text-base mb-1">{t('dashboard.recommendedJobs.noMatchingTitle')}</h3>
                <p className="text-[#667085] text-xs max-w-md mx-auto mb-4">{t('dashboard.recommendedJobs.noMatchingSubtitle')}</p>
                <Link
                  to="/dashboard/find-jobs"
                  className="dashboard-btn inline-flex items-center gap-2 rounded-xl bg-[#1769E0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D5BC4] shadow-xs"
                >
                  <FiSearch className="w-4 h-4" /> {t('dashboard.recommendedJobs.browseJobsBtn')}
                </Link>
              </div>
            ) : (
              <div className="col-span-full rounded-[20px] border border-dashed border-[#E4E7EC] bg-[#F8FAFC] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1769E0]/10 text-[#1769E0] mb-3">
                  <FiZap className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-[#101828] text-base mb-1">{t('dashboard.recommendedJobs.noMatchesTitle')}</h3>
                <p className="text-[#667085] text-xs max-w-md mx-auto mb-4">{t('dashboard.recommendedJobs.noMatchesSubtitle')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/profile')}
                  className="dashboard-btn inline-flex items-center gap-2 rounded-xl bg-[#1769E0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0D5BC4] shadow-xs"
                >
                  <FiUser className="w-4 h-4" /> {t('dashboard.recommendedJobs.completeProfileBtn')}
                </button>
              </div>
            )
          ) : (
            recommendedJobs.map((job) => {
              const score = job.matchScore ?? job.matchPercentage ?? 0;
              const matchBadgeClass =
                score >= 80
                  ? 'bg-blue-50 text-[#1769E0] border-blue-200'
                  : score >= 60
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              const matchLabel =
                score >= 80 ? t('dashboard.jobCard.excellentMatch') : score >= 60 ? t('dashboard.jobCard.goodMatch') : t('dashboard.jobCard.possibleMatch');

              return (
                <div key={job._id || job.jobId} className="dashboard-card rounded-[20px] border border-[#E4E7EC] p-5 bg-white flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#667085] truncate">{job.company?.name || job.company || t('dashboard.jobCard.company')}</p>
                        <h3 className="mt-1 text-base font-bold text-[#101828] truncate">{job.title || t('dashboard.jobCard.jobTitle')}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBookmark(job._id || job.jobId)}
                        className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-2 text-[#667085] hover:bg-[#1769E0]/10 hover:text-[#1769E0] transition flex-shrink-0"
                        title={t('dashboard.jobCard.saveJob')}
                      >
                        <FiBookmark className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Location & Job Type */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-[#667085]">
                      <span className="rounded-md bg-[#F8FAFC] px-2 py-0.5 border border-[#E4E7EC]">{job.location?.city || job.location?.region || (typeof job.location === 'string' ? job.location : t('dashboard.jobCard.remote'))}</span>
                      <span className="rounded-md bg-[#F8FAFC] px-2 py-0.5 border border-[#E4E7EC]">{job.jobType || t('dashboard.jobCard.fullTime')}</span>
                    </div>

                    {/* Matched Skills */}
                    {Array.isArray(job.matchedSkills) && job.matchedSkills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">{t('dashboard.jobCard.matchedSkills')}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {job.matchedSkills.slice(0, 3).map((sk, idx) => (
                            <span key={idx} className="rounded-md bg-blue-50 text-[#1769E0] text-[11px] px-2 py-0.5 font-medium border border-blue-100">
                              ✓ {sk}
                            </span>
                          ))}
                          {job.matchedSkills.length > 3 && (
                            <span className="text-[10px] text-[#98A2B3] self-center">+{job.matchedSkills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {Array.isArray(job.missingSkills) && job.missingSkills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">{t('dashboard.jobCard.missing')}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {job.missingSkills.slice(0, 2).map((sk, idx) => (
                            <span key={idx} className="rounded-md bg-rose-50 text-rose-700 text-[11px] px-2 py-0.5 font-medium border border-rose-100">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Short reason */}
                    {job.reason && (
                      <p className="mt-3 text-[11px] leading-relaxed text-[#475467]">
                        <span className="font-semibold text-[#1769E0]">{t('dashboard.jobCard.matchReason')}: </span>
                        {job.reason}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E4E7EC] flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${matchBadgeClass}`}>
                      <FiZap className="w-3.5 h-3.5" />
                      {score}% {matchLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${job._id || job.jobId}`)}
                        className="dashboard-btn rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#667085] hover:bg-[#1769E0]/10 hover:text-[#1769E0] shadow-xs"
                      >
                        {t('dashboard.jobCard.viewJob')}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${job._id || job.jobId}?apply=1`)}
                        className="dashboard-btn rounded-xl bg-[#1769E0] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0D5BC4] shadow-xs"
                      >
                        {t('dashboard.jobCard.applyNow')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Latest Opportunities Section ── */}
      <div className="rounded-[24px] border border-[#E4E7EC] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#101828]">{t('dashboard.latestOpportunities.title')}</h2>
            <p className="text-xs font-medium text-[#667085]">{t('dashboard.latestOpportunities.subtitle')}</p>
          </div>
          <Link to="/dashboard/find-jobs" className="text-xs font-bold text-[#1769E0] hover:underline">{t('dashboard.latestOpportunities.viewAllJobs')}</Link>
        </div>

        <div className="mt-5 space-y-3">
          {latestOpportunities.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#E4E7EC] bg-[#F8FAFC] p-8 text-center text-xs font-medium text-[#667085]">
              {t('dashboard.latestOpportunities.noJobs')}
            </div>
          ) : (
            latestOpportunities.map((job) => (
              <div key={job._id} className="dashboard-card flex flex-col gap-4 rounded-[18px] border border-[#E4E7EC] p-4 sm:flex-row sm:items-center sm:justify-between bg-white shadow-2xs">
                <div>
                  <p className="text-sm font-bold text-[#101828]">{job.title || t('dashboard.jobCard.jobTitle')}</p>
                  <p className="text-xs font-medium text-[#667085] mt-0.5">{job.company?.name || t('dashboard.jobCard.company')}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-medium text-[#667085]">
                    <span className="rounded-md bg-[#F8FAFC] px-2 py-0.5 border border-[#E4E7EC]">{job.location?.city || job.location?.region || t('dashboard.jobCard.remote')}</span>
                    <span className="rounded-md bg-[#F8FAFC] px-2 py-0.5 border border-[#E4E7EC]">{job.jobType || t('dashboard.jobCard.fullTime')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="dashboard-btn rounded-xl bg-[#1769E0] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D5BC4] shadow-xs"
                  >
                    {t('dashboard.jobCard.applyNow')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBookmark(job._id)}
                    className="dashboard-btn rounded-xl border border-[#E4E7EC] bg-white px-4 py-2 text-xs font-bold text-[#667085] hover:bg-[#F8FAFC]"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/dashboard/find-jobs" className="dashboard-btn inline-flex items-center gap-2 rounded-xl bg-[#1769E0] px-6 py-3 text-xs font-bold text-white hover:bg-[#0D5BC4] shadow-sm">
            {t('dashboard.latestOpportunities.browseMore')}
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );

};

export default JobSeekerDashboard;

