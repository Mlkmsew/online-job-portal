// ============================================
// Footer Component - OnlineJob Portal
// Professional multi-column footer
// ============================================
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FiBriefcase,
  FiChevronRight,
  FiArrowUp,
} from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const socials = [
    { icon: FaFacebookF, label: t('footer.socialFacebook') },
    { icon: FaTwitter, label: t('footer.socialTwitter') },
    { icon: FaLinkedinIn, label: t('footer.socialLinkedin') },
    { icon: FaInstagram, label: t('footer.socialInstagram') },
  ];

  const quickLinks = [
    { to: '/', label: t('nav.home', { defaultValue: 'Home' }) },
    { to: '/jobs', label: t('nav.findJobs', { defaultValue: 'Find Jobs' }) },
    { to: '/companies', label: t('nav.companies', { defaultValue: 'Companies' }) },
    { to: '/categories', label: t('nav.categories', { defaultValue: 'Categories' }) },
    { to: '/about', label: t('nav.about', { defaultValue: 'About Us' }) },
  ];

  const seekerLinks = [
    { to: '/jobs', label: t('footer.browseJobs', { defaultValue: 'Browse Jobs' }) },
    { to: '/dashboard/resume', label: t('footer.createCv', { defaultValue: 'Create CV' }) },
    { to: '/dashboard/saved-jobs', label: t('footer.savedJobs', { defaultValue: 'Saved Jobs' }) },
    { to: '/dashboard/job-alerts', label: t('footer.jobAlerts', { defaultValue: 'Job Alerts' }) },
  ];

  const employerLinks = [
    { to: '/employer/post-job', label: t('footer.postJob', { defaultValue: 'Post a Job' }) },
    { to: '/employer/jobs', label: t('footer.manageJobs', { defaultValue: 'Manage Jobs' }) },
    { to: '/employer/applicants', label: t('footer.applications', { defaultValue: 'Applications' }) },
    { to: '/employer/company', label: t('footer.companyProfile', { defaultValue: 'Company Profile' }) },
  ];

  const supportLinks = [
    { to: '/contact', label: t('footer.contactUs', { defaultValue: 'Contact Us' }) },
    { to: '/faq', label: t('footer.helpCenter', { defaultValue: 'Help Center' }) },
    { to: '/about', label: t('footer.privacyPolicy', { defaultValue: 'Privacy Policy' }) },
    { to: '/about', label: t('footer.termsConditions', { defaultValue: 'Terms & Conditions' }) },
  ];

  const renderColumnHeading = (title) => (
    <h3 className="text-base font-semibold text-white dark:text-gray-100">{title}</h3>
  );

  const renderLinkList = (links) => (
    <ul className="mt-4 space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="group inline-flex items-center gap-2 text-sm text-[#CBD5E1] transition-colors hover:text-white dark:text-gray-400 dark:hover:text-white"
          >
            <FiChevronRight
              className="text-blue-400 transition-transform group-hover:translate-x-0.5 dark:text-blue-400"
              aria-hidden="true"
            />
            <span>{link.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-[#0B1F3A] text-[#CBD5E1] dark:bg-[#0B1F3A] dark:text-gray-300">
      <div className="container-custom py-16">
        {/* ===== 5 COLUMN FOOTER ===== */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center gap-2">
              <FiBriefcase className="h-9 w-9 text-blue-400 dark:text-blue-400" aria-hidden="true" />
              <span className="text-2xl font-bold text-white dark:text-white">
                OnlineJob <span className="text-blue-400 dark:text-blue-400">Portal</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              {t('footer.brandDescription', { defaultValue: 'Connecting Ethiopian talent with trusted employers.' })}
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A2E4A] text-[#E2E8F0] transition-colors hover:bg-blue-500 hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-500 dark:hover:text-white"
                >
                  <social.icon className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            {renderColumnHeading(t('footer.quickLinks'))}
            {renderLinkList(quickLinks)}
          </div>

          {/* Column 3 — For Job Seekers */}
          <div>
            {renderColumnHeading(t('footer.forJobSeekers'))}
            {renderLinkList(seekerLinks)}
          </div>

          {/* Column 4 — For Employers */}
          <div>
            {renderColumnHeading(t('footer.forEmployers'))}
            {renderLinkList(employerLinks)}
          </div>

          {/* Column 5 — Support */}
          <div>
            {renderColumnHeading(t('footer.support'))}
            {renderLinkList(supportLinks)}
          </div>
        </div>

        {/* ===== COPYRIGHT ===== */}
        <div className="mt-14 border-t border-[#274060] pt-8 text-center dark:border-gray-800">
          <p className="text-sm text-[#94A3B8] dark:text-gray-400">
            {t('footer.copyrightLine', { defaultValue: '© 2026 OnlineJob Portal. All Rights Reserved.' })}
          </p>
        </div>
      </div>

      {/* ===== BACK TO TOP ===== */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t('footer.backToTop')}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#E2E8F0] text-[#0F172A] shadow-lg transition-all duration-300 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-blue-600 dark:hover:text-white ${
          showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-16 opacity-0'
        }`}
      >
        <FiArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </footer>
  );
};

export default Footer;