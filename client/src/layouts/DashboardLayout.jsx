// ============================================
// Dashboard Layout — Unified Ethiopian Portal
// ============================================
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminHeaderActions from './AdminHeaderActions';
import { useEffect, useState } from 'react';
import { FiMenu, FiUsers } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import DashboardBackground from '../components/common/DashboardBackground';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import DarkModeToggle from '../components/common/DarkModeToggle';
import socketService from '../services/socket';
import { fetchUnreadCount, setOnlineUsers } from '../store/slices/messagesSlice';

const DashboardLayout = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Global socket listeners — keep the sidebar unread badge + online indicators live
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user?._id || !token) return undefined;

    socketService.connect(token);
    dispatch(fetchUnreadCount());

    const onMessageReceived = (message) => {
      if (message.sender?.toString?.() !== user._id?.toString?.()) {
        dispatch(fetchUnreadCount());
      }
    };
    const onMessageRead = () => dispatch(fetchUnreadCount());
    const onOnlineUsers = (users) => dispatch(setOnlineUsers(users));

    socketService.onGlobal('message-received', onMessageReceived);
    socketService.onGlobal('message-read', onMessageRead);
    socketService.onGlobal('online-users', onOnlineUsers);

    return () => {
      socketService.offGlobal('message-received', onMessageReceived);
      socketService.offGlobal('message-read', onMessageRead);
      socketService.offGlobal('online-users', onOnlineUsers);
    };
  }, [user?._id, dispatch]);

  const fontSize = user?.settings?.appearance?.fontSize || 'Medium';
  const role = user?.role || 'jobseeker';
  // Resume Builder pulls its sticky section nav close to the global header,
  // so the scroll container gets a tighter top padding on that page only.
  const isResumeBuilder = location.pathname === '/dashboard/resume';

  return (
    <div
      className={`relative flex h-screen w-full overflow-hidden ${role === 'admin' ? 'admin-dashboard' : ''}`}
      data-font-size={fontSize}
    >
      {/* Unified Ethiopian Background Layer */}
      <DashboardBackground variant={role} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">

        {/* Mobile Top Bar — unified theme */}
        <header
          className="relative z-20 flex items-center justify-between md:hidden px-4 py-3 backdrop-blur-[12px] border-b"
          style={{
            background: 'var(--header-bg)',
            borderColor: 'var(--header-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 transition-all duration-200 hover:opacity-70"
              style={{ color: 'var(--text-primary)' }}
              aria-label={t('common.openSidebar') || 'Open sidebar menu'}
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                style={{ background: 'var(--primary)' }}
              >
                <FiUsers className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {t('common.appName')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === 'admin' && <AdminHeaderActions />}
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </header>

        {/* Desktop Header — unified theme */}
        <header
          className="relative z-20 hidden md:flex items-center justify-between px-6 py-4 border-b backdrop-blur-[12px]"
          style={{
            background: 'var(--header-bg)',
            borderColor: 'var(--header-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: 'var(--primary)' }}
              aria-hidden="true"
            >
              <FiUsers className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('common.appName')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('common.dashboardControls')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === 'admin' && <AdminHeaderActions />}
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main
          className={
            isResumeBuilder
              ? 'flex-1 overflow-y-auto sidebar-scroll px-4 pb-4 pt-0 sm:px-6 sm:pb-6 sm:pt-0 lg:px-8 lg:pb-8 lg:pt-0'
              : 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 sidebar-scroll'
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};


export default DashboardLayout;
