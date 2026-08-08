// ============================================
// Dashboard Sidebar — Production-quality refinement
// ============================================
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome, FiUser, FiBriefcase, FiFileText, FiBookmark,
  FiSearch, FiBell, FiUsers, FiSettings, FiMail,
  FiBarChart2, FiCalendar, FiLogOut, FiX, FiHelpCircle,
} from 'react-icons/fi';
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
    { path: '/dashboard/resume', icon: FiFileText, label: 'Resume Builder' },
    { path: '/dashboard/job-alerts', icon: FiBell, label: 'Job Alerts' },
    { path: '/dashboard/messages', icon: FiMail, label: 'Messages' },
    { path: '/dashboard/settings', icon: FiSettings, label: 'Settings' },
  ];

  const employerMenu = [
    { path: '/employer', icon: FiHome, label: 'Dashboard' },
    { path: '/employer/post-job', icon: FiBriefcase, label: 'Post Job' },
    { path: '/employer/jobs', icon: FiFileText, label: 'Manage Jobs' },
    { path: '/employer/applicants', icon: FiUsers, label: 'Applicant' },
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
  const dashboardTitle = user?.role === 'admin' ? 'Admin' : user?.role === 'employer' ? 'Employer' : 'Job Seeker';
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'employer' ? 'Employer' : 'Job Seeker';
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-shell fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">{portalLabel}</p>
              <h2 className="mt-1.5 text-lg font-bold text-slate-900 leading-tight">{dashboardTitle}<br /><span className="text-slate-500 font-semibold">Dashboard</span></h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* ── User card ── */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-semibold overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={roleLabel} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <span className="mt-2.5 inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
              {roleLabel}
            </span>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
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
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-[3px] border-emerald-500 pl-[9px]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link to="/help" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                <FiHelpCircle className="w-[18px] h-[18px] text-slate-400" />
                <span>Help & Support</span>
              </Link>
            </div>
          </nav>

          {/* ── Logout ── */}
          <div className="px-3 py-3 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-all duration-150"
            >
              <FiLogOut className="w-[18px] h-[18px]" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
