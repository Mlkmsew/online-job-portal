import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiCalendar,
  FiSearch,
  FiBell,
  FiMail,
  FiChevronDown,
  FiArrowRight,
  FiMapPin,
  FiFlag,
  FiUser,
  FiSettings,
  FiEdit3,
  FiMessageCircle,
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchEmployerDashboard } from '../../../store/slices/employerSlice';
import { logout } from '../../../store/slices/authSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { company, jobs, applications, dashboardStats, loading } = useSelector((state) => state.employer);

  const [dashboardData, setDashboardData] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [fetchingApi, setFetchingApi] = useState(true);

  useEffect(() => {
    dispatch(fetchEmployerDashboard());

    let mounted = true;
    (async () => {
      try {
        setFetchingApi(true);
        const [dashboardRes, notificationCountRes, chatCountRes] = await Promise.all([
          api.get('/employer/dashboard'),
          api.get('/notifications/unread/count?excludeType=new_message'),
          api.get('/messages/unread/count'),
        ]);
        if (!mounted) return;
        const dash = dashboardRes.data?.data || dashboardRes.data || null;
        setDashboardData(dash);
        setInterviews(dash?.upcomingInterviews || []);
        setNotifications((dash?.recentNotifications || []).filter((n) => n.type !== 'new_message'));
        if (notificationCountRes.data?.count !== undefined) setUnreadNotificationCount(notificationCountRes.data.count);
        if (chatCountRes.data?.count !== undefined) setUnreadChatCount(chatCountRes.data.count);
      } catch (err) {
        // handled gracefully
      } finally {
        if (mounted) setFetchingApi(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Combine Redux state & API backend data dynamically from real database records
  const stats = dashboardData || dashboardStats || {};
  const jobsPosted = stats.totalJobs ?? jobs?.length ?? 0;
  const activeJobs = stats.activeJobs ?? jobs?.filter((job) => job.status === 'active' || job.status === 'published').length ?? 0;
  const totalApplicants = stats.totalApplicants ?? applications?.length ?? 0;
  const newApplicantsCount = stats.newApplicantsCount ?? 0;
  const interviewsCount = stats.interviewsCount ?? interviews?.length ?? 0;
  const hiredCount = stats.hiredCount ?? applications?.filter((item) => ['hired', 'Hired', 'Selected'].includes(item.status)).length ?? 0;

  const profileCompletion = useMemo(() => {
    const targetCompany = company || stats.company;
    if (!targetCompany) return 0;
    const fields = [
      targetCompany.name,
      targetCompany.description,
      targetCompany.industry,
      targetCompany.location?.address || targetCompany.location,
      targetCompany.logo,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [company, stats.company]);

  // Real Analytics Funnel Percentages calculated directly from database records
  const analyticsFunnel = useMemo(() => {
    if (stats.analytics) {
      return {
        newAppsPct: stats.analytics.newApplications?.percentage ?? 0,
        underReviewPct: stats.analytics.underReview?.percentage ?? 0,
        interviewPct: stats.analytics.interview?.percentage ?? 0,
        hiredPct: stats.analytics.hired?.percentage ?? 0,
      };
    }

    const total = totalApplicants || 0;
    if (total === 0) {
      return { newAppsPct: 0, underReviewPct: 0, interviewPct: 0, hiredPct: 0 };
    }

    const countNew = applications?.filter((a) => ['Submitted'].includes(a.status)).length || 0;
    const countReview = applications?.filter((a) => ['Reviewed', 'Under Review'].includes(a.status)).length || 0;
    const countInterview = applications?.filter((a) => ['Interview', 'Interview Scheduled', 'Shortlisted'].includes(a.status)).length || 0;
    const countHired = applications?.filter((a) => ['Hired', 'Selected'].includes(a.status)).length || 0;

    return {
      newAppsPct: Math.round((countNew / total) * 100),
      underReviewPct: Math.round((countReview / total) * 100),
      interviewPct: Math.round((countInterview / total) * 100),
      hiredPct: Math.round((countHired / total) * 100),
    };
  }, [stats.analytics, applications, totalApplicants]);

  const chartData = useMemo(() => ({
    labels: [
      t('dashboard.analytics.newApplications'),
      t('dashboard.analytics.underReview'),
      t('dashboard.analytics.interview'),
      t('dashboard.analytics.hired'),
    ],
    datasets: [
      {
        data: [
          analyticsFunnel.newAppsPct,
          analyticsFunnel.underReviewPct,
          analyticsFunnel.interviewPct,
          analyticsFunnel.hiredPct,
        ],
        backgroundColor: ['#4D8DF0', '#7FB0F0', '#0D5BC4', '#1769E0'],
        hoverBackgroundColor: ['#7FB0F0', '#A8C8F5', '#4D8DF0', '#3B82F6'],
        borderWidth: 0,
      },
    ],
  }), [analyticsFunnel, t]);

  const chartOptions = {
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success(t('auth.logoutSuccess'));
      navigate('/');
    } catch {
      toast.error(t('auth.logoutFailed'));
    }
  };

  const activeCompany = company || stats.company;

  const companyLocation = useMemo(() => {
    const loc = activeCompany?.location;
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    return [loc.address, loc.city, loc.region].filter(Boolean).join(', ');
  }, [activeCompany]);

  const memberSinceDate = activeCompany?.createdAt || user?.createdAt;

  if (loading && fetchingApi) {
    return (
      <div className="space-y-8 pb-16 animate-pulse">
        <div className="h-16 rounded-2xl bg-slate-200 dark:bg-[#142A24]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-[#142A24]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 h-64 rounded-3xl bg-slate-200 dark:bg-[#142A24]" />
          <div className="lg:col-span-5 h-64 rounded-3xl bg-slate-200 dark:bg-[#142A24]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      
      {/* ── Top Header Greeting & Right Control Bar ── */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#64746E] dark:text-[#A9BBB4]">
            {t('dashboard.welcomeBack', { name: user?.firstName || user?.name || 'Employer' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14231F] dark:text-[#F4F8F6] tracking-tight mt-1">
            {t('dashboard.headerSubtitle')}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bell Icon Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#142A24] border border-[#E1E8E4] dark:border-[#23483D] text-[#14231F] dark:text-[#F4F8F6] shadow-2xs hover:bg-gray-50 dark:hover:bg-[#18342C] transition"
              aria-label="Notifications"
            >
              <FiBell className="w-4.5 h-4.5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] pb-2">
                  <h4 className="text-xs font-bold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.notifications.title')}</h4>
                  <Link to="/employer/applicants" className="text-xs font-semibold text-[#1769E0] dark:text-[#3B82F6] hover:underline">{t('common.viewAll')}</Link>
                </div>
                <div className="mt-2 max-h-52 space-y-2 overflow-auto sidebar-scroll">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif._id} className="p-2 rounded-lg bg-slate-50 dark:bg-[#10231E] text-xs text-[#14231F] dark:text-[#F4F8F6]">
                        {notif.message || notif.title}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-xs text-[#64746E] dark:text-[#A9BBB4]">
                      {t('dashboard.notifications.noNotifications') || 'No new notifications'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mail Icon Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => navigate('/employer/messages')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#142A24] border border-[#E1E8E4] dark:border-[#23483D] text-[#14231F] dark:text-[#F4F8F6] shadow-2xs hover:bg-gray-50 dark:hover:bg-[#18342C] transition"
              aria-label={t('nav.messages')}
            >
              <FiMail className="w-4.5 h-4.5" />
              {unreadChatCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1769E0] dark:bg-[#3B82F6] px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2.5 rounded-full border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] px-3 py-1.5 shadow-2xs hover:bg-gray-50 dark:hover:bg-[#18342C] transition"
            >
              <div className="h-7 w-7 overflow-hidden rounded-full bg-[#1769E0] dark:bg-[#3B82F6] text-white text-xs font-bold flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="user avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{(user?.firstName || user?.name || 'E').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-semibold text-[#14231F] dark:text-[#F4F8F6]">{user?.firstName || user?.name || 'Employer'}</span>
              <FiChevronDown className="w-3.5 h-3.5 text-[#64746E] dark:text-[#A9BBB4]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => { setShowProfileMenu(false); navigate('/employer/company'); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#14231F] dark:text-[#F4F8F6] hover:bg-slate-50 dark:hover:bg-[#18342C]"
                >
                  <FiUser className="h-4 w-4 text-[#1769E0] dark:text-[#3B82F6]" /> {t('sidebar.companyProfile')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowProfileMenu(false); navigate('/employer/settings'); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#14231F] dark:text-[#F4F8F6] hover:bg-slate-50 dark:hover:bg-[#18342C]"
                >
                  <FiSettings className="h-4 w-4 text-[#64746E]" /> {t('nav.settings')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                >
                  <FiArrowRight className="h-4 w-4" /> {t('nav.logout')}
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── 5 Real Stat Cards Row ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Jobs Posted */}
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FE] dark:bg-[#041D3F]/40 text-[#1769E0] dark:text-[#3B82F6]">
              <FiBriefcase className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.jobsPosted')}</p>
              <p className="mt-1 text-2xl font-bold text-[#14231F] dark:text-[#F4F8F6]">{jobsPosted}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#64746E] dark:text-[#7F958C] font-medium">{t('dashboard.active', { count: activeJobs })}</p>
        </div>

        {/* Card 2: Total Applicants */}
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FE] dark:bg-[#041D3F]/40 text-[#1769E0] dark:text-[#3B82F6]">
              <FiUsers className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.totalApplicants')}</p>
              <p className="mt-1 text-2xl font-bold text-[#14231F] dark:text-[#F4F8F6]">{totalApplicants}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#64746E] dark:text-[#7F958C] font-medium">
            {newApplicantsCount > 0 ? `+${newApplicantsCount} ${t('dashboard.newThisWeek')}` : `0 ${t('dashboard.newThisWeek')}`}
          </p>
        </div>

        {/* Card 3: Active Jobs */}
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FE] dark:bg-[#041D3F]/40 text-[#1769E0] dark:text-[#3B82F6]">
              <FiFlag className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.activeJobs')}</p>
              <p className="mt-1 text-2xl font-bold text-[#14231F] dark:text-[#F4F8F6]">{activeJobs}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#64746E] dark:text-[#7F958C] font-medium">{t('dashboard.liveRoles', { count: activeJobs })}</p>
        </div>

        {/* Card 4: Upcoming Interviews */}
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <FiCalendar className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.upcomingInterviews')}</p>
              <p className="mt-1 text-2xl font-bold text-[#14231F] dark:text-[#F4F8F6]">{interviewsCount}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#64746E] dark:text-[#7F958C] font-medium">{t('dashboard.scheduled', { count: interviewsCount })}</p>
        </div>

        {/* Card 5: Hired Candidates */}
        <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FE] dark:bg-[#041D3F]/40 text-[#1769E0] dark:text-[#3B82F6]">
              <FiCheckCircle className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.hiredCandidates')}</p>
              <p className="mt-1 text-2xl font-bold text-[#14231F] dark:text-[#F4F8F6]">{hiredCount}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#64746E] dark:text-[#7F958C] font-medium">{t('dashboard.filled', { count: hiredCount })}</p>
        </div>
      </section>

      {/* ── Bottom Section: Company Overview & Analytics ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Column: Company Overview Card */}
        <div className="lg:col-span-7 rounded-3xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2FE] dark:bg-[#041D3F]/40 text-[#1769E0] dark:text-[#3B82F6]">
                <FiUser className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.companyOverview')}</p>
                <h3 className="text-lg font-bold text-[#14231F] dark:text-[#F4F8F6]">{activeCompany?.name || t('dashboard.noCompanyProfile')}</h3>
                <p className="text-xs text-[#64746E] dark:text-[#A9BBB4] font-medium">{activeCompany?.industry || t('dashboard.notProvided')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/employer/company')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#1769E0]/30 bg-[#EAF2FE]/50 dark:bg-[#041D3F]/30 px-3.5 py-1.5 text-xs font-bold text-[#1769E0] dark:text-[#3B82F6] hover:bg-[#DCEAFD]/60 transition"
            >
              <FiEdit3 className="w-3.5 h-3.5" />
              <span>{t('dashboard.editProfile')}</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#F0F4F2] dark:bg-[#10231E] p-4 border border-[#E1E8E4] dark:border-[#23483D]">
              <div className="flex items-center gap-2 text-[#64746E] dark:text-[#A9BBB4] text-xs font-medium">
                <FiMapPin className="w-4 h-4" />
                <span>{t('dashboard.location')}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-[#14231F] dark:text-[#F4F8F6]">
                {companyLocation || t('dashboard.notProvided')}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F0F4F2] dark:bg-[#10231E] p-4 border border-[#E1E8E4] dark:border-[#23483D]">
              <div className="flex items-center gap-2 text-[#64746E] dark:text-[#A9BBB4] text-xs font-medium">
                <FiUsers className="w-4 h-4" />
                <span>{t('dashboard.companySize')}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-[#14231F] dark:text-[#F4F8F6]">
                {activeCompany?.companySize || activeCompany?.size || t('dashboard.notProvided')}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F0F4F2] dark:bg-[#10231E] p-4 border border-[#E1E8E4] dark:border-[#23483D]">
              <div className="flex items-center gap-2 text-[#64746E] dark:text-[#A9BBB4] text-xs font-medium">
                <FiCalendar className="w-4 h-4" />
                <span>{t('dashboard.memberSince')}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-[#14231F] dark:text-[#F4F8F6]">
                {memberSinceDate
                  ? new Date(memberSinceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : t('dashboard.notProvided')}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F0F4F2] dark:bg-[#10231E] p-4 border border-[#E1E8E4] dark:border-[#23483D]">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.profileCompletion')}</span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-[#14231F] dark:text-[#F4F8F6]">{profileCompletion}% {t('dashboard.complete')}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full rounded-full bg-[#1769E0] dark:bg-[#3B82F6] transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
          </div>

          {!activeCompany && (
            <div className="mt-6 rounded-2xl border border-dashed border-[#1769E0]/30 bg-[#EAF2FE]/50 dark:bg-[#041D3F]/30 p-5 text-center">
              <p className="text-sm font-semibold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.noCompanyProfile')}</p>
              <p className="mt-1 text-xs text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.noCompanyProfileDesc')}</p>
              <button
                type="button"
                onClick={() => navigate('/employer/company')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1769E0] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D5BC4] transition"
              >
                <FiEdit3 className="w-3.5 h-3.5" />
                {t('dashboard.completeCompanyProfile')}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Real Analytics Funnel Card */}
        <div className="lg:col-span-5 rounded-3xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] pb-4">
            <div>
              <p className="text-xs font-semibold text-[#64746E] dark:text-[#A9BBB4]">{t('dashboard.analytics.title')}</p>
              <h3 className="text-lg font-bold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.applicantFunnel')}</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FE] dark:bg-[#041D3F]/40 px-3 py-1 text-[11px] font-semibold text-[#1769E0] dark:text-[#3B82F6]">
              <span className="h-2 w-2 rounded-full bg-[#1769E0] dark:bg-[#3B82F6] animate-pulse" />
              {t('dashboard.liveData')}
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative h-44 w-44 shrink-0">
              <Doughnut data={chartData} options={chartOptions} />
            </div>

            <div className="space-y-3 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#4D8DF0]" />
                  <span className="font-semibold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.analytics.newApplications')}</span>
                </div>
                <span className="font-bold text-[#14231F] dark:text-[#F4F8F6]">{analyticsFunnel.newAppsPct}%</span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#7FB0F0]" />
                  <span className="font-semibold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.analytics.underReview')}</span>
                </div>
                <span className="font-bold text-[#14231F] dark:text-[#F4F8F6]">{analyticsFunnel.underReviewPct}%</span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#0D5BC4]" />
                  <span className="font-semibold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.analytics.interview')}</span>
                </div>
                <span className="font-bold text-[#14231F] dark:text-[#F4F8F6]">{analyticsFunnel.interviewPct}%</span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#1769E0]" />
                  <span className="font-semibold text-[#14231F] dark:text-[#F4F8F6]">{t('dashboard.analytics.hired')}</span>
                </div>
                <span className="font-bold text-[#14231F] dark:text-[#F4F8F6]">{analyticsFunnel.hiredPct}%</span>
              </div>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};

export default EmployerDashboard;
