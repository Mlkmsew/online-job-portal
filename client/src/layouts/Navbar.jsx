// ============================================
// Navbar Component with Accessibility, Multi-language & Dark Mode
// WCAG 2.2 AA: ARIA labels, keyboard nav, focus management
// ============================================
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX, FiBriefcase, FiUser, FiLogOut } from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import DarkModeToggle from '../components/common/DarkModeToggle';

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);

  // Close mobile menu on route change or Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success(t('auth.logoutSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(t('auth.logoutFailed'));
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'employer') return '/employer';
    return '/dashboard';
  };

  return (
    <nav
      className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" aria-label="EthioJob - Go to homepage">
            <FiBriefcase className="w-8 h-8 text-primary-500" aria-hidden="true" />
            <span className="text-2xl font-bold text-primary-500">EthioJob</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6" role="menubar">
            <Link to="/jobs" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition" role="menuitem">
              {t('nav.jobs')}
            </Link>
            <Link to="/companies" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition" role="menuitem">
              {t('nav.companies')}
            </Link>
            <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition" role="menuitem">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition" role="menuitem">
              {t('nav.contact')}
            </Link>
            <Link to="/career-guide" className="text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 transition" role="menuitem">
              {t('nav.careerGuide')}
            </Link>

            <LanguageSwitcher />
            <DarkModeToggle />

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="btn btn-ghost" aria-label="Go to your dashboard">
                  <FiUser className="mr-2" aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" aria-label="Log out of your account">
                  <FiLogOut className="mr-2" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 dark:text-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            className="md:hidden py-4 space-y-4"
            role="menu"
            aria-label="Mobile navigation"
          >
            <Link to="/jobs" className="block text-gray-700 dark:text-gray-300 hover:text-primary-500 py-2" role="menuitem" onClick={() => setIsOpen(false)}>
              {t('nav.jobs')}
            </Link>
            <Link to="/companies" className="block text-gray-700 dark:text-gray-300 hover:text-primary-500 py-2" role="menuitem" onClick={() => setIsOpen(false)}>
              {t('nav.companies')}
            </Link>
            <Link to="/about" className="block text-gray-700 dark:text-gray-300 hover:text-primary-500 py-2" role="menuitem" onClick={() => setIsOpen(false)}>
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="block text-gray-700 dark:text-gray-300 hover:text-primary-500 py-2" role="menuitem" onClick={() => setIsOpen(false)}>
              {t('nav.contact')}
            </Link>
            <Link to="/career-guide" className="block text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 py-2" role="menuitem" onClick={() => setIsOpen(false)}>
              {t('nav.careerGuide')}
            </Link>
            
            <div className="flex items-center gap-4 py-2">
              <LanguageSwitcher />
              <DarkModeToggle />
            </div>
            
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="block btn btn-ghost w-full text-left" role="menuitem" onClick={() => setIsOpen(false)}>
                  {t('nav.dashboard')}
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block btn btn-ghost w-full text-left" role="menuitem">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block btn btn-ghost w-full text-left" role="menuitem" onClick={() => setIsOpen(false)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="block btn btn-primary w-full text-left" role="menuitem" onClick={() => setIsOpen(false)}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
