// ============================================
// Navbar Component with Accessibility, Multi-language & Dark Mode
// WCAG 2.2 AA: ARIA labels, keyboard nav, focus management
// ============================================
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX, FiBriefcase, FiUser, FiLogOut } from 'react-icons/fi';
import { logout, logoutUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import DarkModeToggle from '../components/common/DarkModeToggle';

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
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
    } catch (error) {
      toast.error(t('auth.logoutFailed'));
    } finally {
      dispatch(logoutUser());
      navigate('/');
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'employer') return '/employer';
    return '/dashboard';
  };

  const navItems = [
    { to: '/', label: t('nav.home', { defaultValue: 'Home' }), match: '/' },
    { to: '/jobs', label: t('nav.findJobs', { defaultValue: 'Find Jobs' }), match: '/jobs' },
    { to: '/companies', label: t('nav.companies', { defaultValue: 'Companies' }), match: '/companies' },
    { to: '/categories', label: t('nav.categories', { defaultValue: 'Categories' }), match: '/categories' },
    { to: '/about', label: t('nav.about', { defaultValue: 'About Us' }), match: '/about' },
    { to: '/contact', label: t('nav.contact', { defaultValue: 'Contact' }), match: '/contact' },
  ];

  const isActive = (item) => {
    const { match } = item;
    if (match === '/') return location.pathname === '/';
    return location.pathname === match;
  };

  // Dark navy navbar background applies to every page regardless of route.
  const navShellClass = 'relative sticky top-0 z-50 pb-10';

  const logoIconClass = 'text-[#60A5FA]';
  const logoTitleClass = 'text-white';
  const logoAccentClass = 'text-[#60A5FA]';

  const desktopLinkClass = (active) =>
    `rounded-lg px-3 xl:px-4 py-2 text-sm xl:text-base whitespace-nowrap transition ${
      active
        ? 'bg-[#1769E0]/25 font-semibold text-white ring-1 ring-white/15'
        : 'font-medium text-sky-100 hover:bg-white/10 hover:text-white'
    }`;

  const mobileLinkClass = (active) =>
    `block rounded-lg px-4 py-2.5 text-base transition ${
      active ? 'bg-[#1769E0]/25 font-semibold text-white ring-1 ring-white/15' : 'font-medium text-sky-100 hover:bg-white/10 hover:text-white'
    }`;

  const ghostLinkClass =
    'inline-flex items-center rounded-lg px-3 xl:px-4 py-2 text-sm font-medium text-sky-100 whitespace-nowrap transition hover:bg-white/10 hover:text-white';

  const hamburgerClass =
    'lg:hidden text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981]';

  return (
    <nav
      className={navShellClass}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Dark navy hero-matching background (image only on non-contact pages) */}
      {location.pathname !== '/contact' && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg-career.svg')" }}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06152B]/95 via-[#0A2A5E]/90 to-[#0E3A7A]/85 dark:from-[#02040A]/95 dark:via-[#081020]/95 dark:to-[#0D1626]/90" aria-hidden="true" />

      <div className="relative container-custom">
        <div className="flex justify-between items-center gap-4 lg:gap-8 h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={t('aria.homepage') || 'OnlineJob Portal - Go to homepage'}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <FiBriefcase className={`h-5 w-5 ${logoIconClass}`} aria-hidden="true" />
            </span>
            <span className={`text-[20px] font-extrabold leading-none tracking-tight ${logoTitleClass}`}>
              OnlineJob <span className={logoAccentClass}>Portal</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4" role="menubar">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={desktopLinkClass(isActive(item))}
                role="menuitem"
              >
                {item.label}
              </Link>
            ))}

            <LanguageSwitcher light={true} />
            <DarkModeToggle />

            {loading ? (
              <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-sky-100" aria-hidden="true">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
              </span>
            ) : isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className={ghostLinkClass} aria-label="Go to your dashboard">
                  <FiUser className="mr-2" aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
                <button onClick={handleLogout} className={ghostLinkClass} aria-label="Log out of your account">
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
            className={hamburgerClass}
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
            className={`lg:hidden py-4 space-y-4`}
            role="menu"
            aria-label="Mobile navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={mobileLinkClass(isActive(item))}
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex items-center gap-4 py-2">
              <LanguageSwitcher light={true} />
              <DarkModeToggle />
            </div>

            {loading ? (
              <span className="block rounded-lg px-4 py-2.5 text-center text-sm font-medium text-sky-100" aria-hidden="true">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-transparent align-middle" />
              </span>
            ) : isAuthenticated ? (
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