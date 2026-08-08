// ============================================
// Dashboard Layout
// ============================================
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const fontSize = user?.settings?.appearance?.fontSize || 'Medium';
  const isEmployer = user?.role === 'employer';

  return (
    <div
      className={`flex h-screen ${isEmployer ? 'employer-dashboard' : ''} bg-white text-slate-900`}
      data-font-size={isEmployer ? fontSize : undefined}
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-700 dark:text-gray-300"
          >
            <FiMenu className="w-6 h-6" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
