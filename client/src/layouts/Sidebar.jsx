// ============================================
// Dashboard Sidebar
// ============================================
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiHome, FiUser, FiBriefcase, FiFileText, FiBookmark, FiSearch, FiZap, FiBell, FiBookOpen, FiUsers, FiSettings, FiMail, FiBarChart2, FiCalendar, FiLogOut, FiX } from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const jobSeekerMenu = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/dashboard/find-jobs', icon: FiSearch, label: 'Find Jobs' },
    { path: '/dashboard/applications', icon: FiFileText, label: 'Applications' },
    { path: '/dashboard/saved-jobs', icon: FiBookmark, label: 'Saved Jobs' },
    { path: '/dashboard/profile', icon: FiUser, label: 'My CV / Profile' },
    { path: '/dashboard/resume', icon: FiFileText, label: 'Resume' },
    { path: '/dashboard/job-alerts', icon: FiBell, label: 'Job Alerts' },
    { path: '/dashboard/messages', icon: FiMail, label: 'Messages' },
    { path: '/dashboard/settings', icon: FiSettings, label: 'Settings' },
  ];

  const employerMenu = [
    { path: '/employer', icon: FiHome, label: 'Dashboard' },
    { path: '/employer/post-job', icon: FiBriefcase, label: 'Post Job' },
    { path: '/employer/jobs', icon: FiFileText, label: 'Manage Jobs' },
    { path: '/employer/applicants', icon: FiBookOpen, label: 'Applicant' },
    { path: '/employer/interviews', icon: FiCalendar, label: 'Interviews' },
    { path: '/employer/company', icon: FiSettings, label: 'Company Profile' },
    { path: '/employer/messages', icon: FiMail, label: 'Messages' },
    { path: '/employer/settings', icon: FiSettings, label: 'Settings' },
  ];

  const adminMenu = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/users', icon: FiUsers, label: 'Manage Users' },
    { path: '/admin/companies', icon: FiBriefcase, label: 'Manage Companies' },
    { path: '/admin/jobs', icon: FiBriefcase, label: 'Manage Jobs' },
    { path: '/admin/categories', icon: FiSettings, label: 'Job Categories' },
    { path: '/admin/applications', icon: FiFileText, label: 'Applications' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Reports & Statistics' },
    { path: '/admin/messages', icon: FiMail, label: 'Messages' },
  ];

  const getMenu = () => {
    if (user?.role === 'admin') return adminMenu;
    if (user?.role === 'employer') return employerMenu;
    return jobSeekerMenu;
  };

  const menu = getMenu();
  const portalLabel = user?.role === 'admin' ? 'Admin Portal' : user?.role === 'employer' ? 'Employer Portal' : 'Job Seeker Portal';
  const dashboardTitle = user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'employer' ? 'Employer Dashboard' : 'Job Seeker Dashboard';
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'employer' ? 'Employer' : 'Job Seeker';

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-500">{portalLabel}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{dashboardTitle}</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-900/50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-emerald-200 shadow-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={roleLabel} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="mt-1 text-xs text-slate-400 truncate">{user?.email}</p>
                  <span className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300 shadow-sm">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-sm border-l-4 border-emerald-500'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link to="/help" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <FiMail className="w-5 h-5" />
                <span>Help & Support</span>
              </Link>
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
