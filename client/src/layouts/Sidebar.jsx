import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FiHome, FiUser, FiBriefcase, FiFileText, FiBookmark,
  FiSearch, FiBell, FiUsers, FiSettings, FiMail,
  FiBarChart2, FiCalendar, FiLogOut, FiX, FiShield
} from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success(t('auth.logoutSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(t('auth.logoutFailed'));
    }
  };

  const jobSeekerMenu = [
    { path: '/dashboard', icon: FiHome, label: 'nav.dashboard' },
    { path: '/dashboard/find-jobs', icon: FiSearch, label: 'sidebar.findJobs' },
    { path: '/dashboard/applications', icon: FiFileText, label: 'sidebar.applications' },
    { path: '/dashboard/saved-jobs', icon: FiBookmark, label: 'sidebar.savedJobs' },
    { path: '/dashboard/profile', icon: FiUser, label: 'nav.profile' },
    { path: '/dashboard/resume', icon: FiFileText, label: 'sidebar.resumeBuilder' },
    { path: '/dashboard/certificate-verification', icon: FiShield, label: 'sidebar.certificateVerification' },
    { path: '/dashboard/job-alerts', icon: FiBell, label: 'sidebar.jobAlerts' },
    { path: '/dashboard/messages', icon: FiMail, label: 'nav.messages', badge: 'messages' },
    { path: '/dashboard/settings', icon: FiSettings, label: 'nav.settings' },
  ];

  const employerMenu = [
    { path: '/employer', icon: FiHome, label: 'nav.dashboard' },
    { path: '/employer/post-job', icon: FiBriefcase, label: 'sidebar.postJob' },
    { path: '/employer/jobs', icon: FiFileText, label: 'sidebar.manageJobs' },
    { path: '/employer/applicants', icon: FiUsers, label: 'sidebar.applicants' },
    { path: '/employer/interviews', icon: FiCalendar, label: 'sidebar.interviews' },
    { path: '/employer/company', icon: FiSettings, label: 'sidebar.companyProfile' },
    { path: '/employer/messages', icon: FiMail, label: 'nav.messages', badge: 'messages' },
    { path: '/employer/settings', icon: FiSettings, label: 'nav.settings' },
  ];

  const adminMenu = [
    { path: '/admin', icon: FiHome, label: 'nav.dashboard' },
    { path: '/admin/users', icon: FiUsers, label: 'sidebar.manageUsers' },
    { path: '/admin/companies', icon: FiBriefcase, label: 'sidebar.manageCompanies' },
    { path: '/admin/jobs', icon: FiBriefcase, label: 'sidebar.manageJobs' },
    { path: '/admin/categories', icon: FiSettings, label: 'sidebar.jobCategories' },
    { path: '/admin/applications', icon: FiFileText, label: 'sidebar.applications' },
    { path: '/admin/certificates', icon: FiShield, label: 'sidebar.certificateVerification' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'sidebar.reports' },
    { path: '/admin/notifications', icon: FiBell, label: 'sidebar.notifications', badge: 'notifications' },
    { path: '/admin/messages', icon: FiMail, label: 'nav.messages', badge: 'messages' },
  ];

  const getMenu = () => {
    if (user?.role === 'admin') return adminMenu;
    if (user?.role === 'employer') return employerMenu;
    return jobSeekerMenu;
  };

  const menu = getMenu();
  const roleLabel = user?.role === 'admin'
    ? t('roles.admin')
    : user?.role === 'employer'
      ? t('roles.employer')
      : t('roles.jobSeeker');
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;
  const unreadMessages = useSelector((state) => state.messages.unreadCount);
  const unreadNotifications = useSelector((state) => state.notifications.unreadCount);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Standardized Sidebar Component */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[264px] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--sidebar-text)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        <div className="flex flex-col h-full relative">
          
          {/* Mobile close button (kept for all roles) */}
          <div className="md:hidden flex justify-end px-4 pt-3 pb-1">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              aria-label="Close sidebar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* ── User Profile Block ── */}
          <div className="px-5 py-4 border-b border-[#E5EAF1] dark:border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-base font-bold overflow-hidden shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt={roleLabel} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials || 'US'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-[#14231F] dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-[#64746E] dark:text-[#A9BBB4] truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2.5">
              <span className="inline-flex items-center rounded-md bg-[var(--sidebar-active)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-active)] border border-[var(--sidebar-active)]/20">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* ── Navigation Menu ── */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto sidebar-scroll z-10">
            {menu.map((item) => {
              const Icon = item.icon;
              const isRoot = item.path === '/admin' || item.path === '/dashboard' || item.path === '/employer';
              const isActive = isRoot
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--sidebar-active)] text-white font-semibold shadow-sm'
                      : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-active)]/10 hover:text-[var(--sidebar-active)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--sidebar-text-muted)] group-hover:text-[var(--sidebar-active)]'}`} />
                    <span className="truncate">{t(item.label)}</span>
                  </div>
                  {item.badge && item.badge === 'messages' ? (
                    unreadMessages > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1769E0] dark:bg-[#1769E0] px-1.5 text-[10px] font-bold text-white">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    ) : null
                  ) : item.badge === 'notifications' ? (
                    unreadNotifications > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1769E0] dark:bg-[#1769E0] px-1.5 text-[10px] font-bold text-white">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    ) : null
                  ) : item.badge ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1769E0] dark:bg-[#1769E0] px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}

          </nav>

          {/* ── Logout Button ── */}
          <div className="px-3 py-3 border-t border-[#E5EAF1] dark:border-[#1E293B] z-10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
