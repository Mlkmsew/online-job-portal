// ============================================
// Dashboard Sidebar
// ============================================
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiHome, FiUser, FiBriefcase, FiFileText, FiBookmark, FiSearch, FiZap, FiBell, FiBookOpen, FiUsers, FiSettings, FiMail, FiBarChart2, FiLogOut, FiX } from 'react-icons/fi';
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
    { path: '/dashboard/skill-assessment', icon: FiZap, label: 'Skill Assessment' },
    { path: '/dashboard/job-alerts', icon: FiBell, label: 'Job Alerts' },
    { path: '/dashboard/messages', icon: FiMail, label: 'Messages' },
    { path: '/dashboard/career-resources', icon: FiBookOpen, label: 'Career Resources' },
    { path: '/dashboard/settings', icon: FiSettings, label: 'Settings' },
  ];

  const employerMenu = [
    { path: '/employer', icon: FiHome, label: 'Dashboard' },
    { path: '/employer/post-job', icon: FiBriefcase, label: 'Post Job' },
    { path: '/employer/jobs', icon: FiBriefcase, label: 'Manage Jobs' },
    { path: '/employer/company', icon: FiSettings, label: 'Company Profile' },
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
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-primary-500">
              {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'employer' ? 'Employer' : 'Dashboard'}
            </h2>
            <button onClick={() => setIsOpen(false)} className="md:hidden">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 border-l-4 border-emerald-500 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t dark:border-gray-700">
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
