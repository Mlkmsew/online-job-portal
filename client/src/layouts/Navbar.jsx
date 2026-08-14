// ============================================
// Navbar Component with Accessibility, Multi-language & Dark Mode
// WCAG 2.2 AA: ARIA labels, keyboard nav, focus management
// ============================================
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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

  const navItems = [
    { to: '/', label: t('nav.home', { defaultValue: 'Home' }) },
    { to: '/jobs', label: t('nav.findJobs', { defaultValue: 'Find Jobs' }) },
    { to: '/companies', label: t('nav.companies', { defaultValue: 'Companies' }) },
    { to: '/jobs', label: t('nav.categories', { defaultValue: 'Categories' }) },
    { to: '/about', label: t('nav.about', { defaultValue: 'About Us' }) },
    { to: '/contact', label: t('nav.contact', { defaultValue: 'Contact' }) },
  ];

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav
      className="relative sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Hero-matching background: same career SVG + navy gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg-career.svg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06152B]/95 via-[#0A2A5E]/90 to-[#0E3A7A]/85" aria-hidden="true" />

      <div className="relative container-custom">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" aria-label={t('aria.homepage') || 'OnlineJob Portal - Go to homepage'}>
            <FiBriefcase className="w-8 h-8 text-emerald-400" aria-hidden="true" />
            <span className="text-[23px] font-extrabold leading-tight text-white">
              OnlineJob <span className="text-emerald-400">Portal</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6" role="menubar">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`pb-1 text-base transition ${
                  isActive(item.to)
                    ? 'border-b-2 border-emerald-400 font-semibold text-emerald-400'
                    : 'font-medium text-sky-100 hover:text-white'
                }`}
                role="menuitem"
              >
                {item.label}
              </Link>
            ))}

            <LanguageSwitcher light />
            <DarkModeToggle />

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-white/10 hover:text-white" aria-label="Go to your dashboard">
                  <FiUser className="mr-2" aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
                <button onClick={handleLogout} className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-white/10 hover:text-white" aria-label="Log out of your account">
                  <FiLogOut className="mr-2" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D4FB0]"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`block py-2 text-base ${isActive(item.to) ? 'font-semibold text-emerald-400' : 'font-medium text-sky-100 hover:text-white'}`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex items-center gap-4 py-2">
              <LanguageSwitcher light />
              <DarkModeToggle />
            </div>

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="block btn btn-ghost w-full text-left text-sky-100" role="menuitem" onClick={() => setIsOpen(false)}>
                  {t('nav.dashboard')}
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block btn btn-ghost w-full text-left text-sky-100" role="menuitem">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block w-full rounded-lg border border-white/70 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10" role="menuitem" onClick={() => setIsOpen(false)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="block w-full rounded-lg bg-[#1769E0] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0D4FB0]" role="menuitem" onClick={() => setIsOpen(false)}>
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