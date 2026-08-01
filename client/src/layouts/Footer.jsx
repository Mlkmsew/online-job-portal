// ============================================
// Footer Component
// ============================================
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FiBriefcase className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">Online Job</span>
            </div>
            <p className="text-sm">
              {t('footer.brandDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><Link to="/jobs" className="hover:text-primary-500 transition">{t('nav.jobs')}</Link></li>
              <li><Link to="/companies" className="hover:text-primary-500 transition">{t('nav.companies')}</Link></li>
              <li><Link to="/about" className="hover:text-primary-500 transition">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500 transition">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          {/* For Job Seekers */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.forJobSeekers')}</h3>
            <ul className="space-y-2">
              <li><Link to="/register" className="hover:text-primary-500 transition">{t('auth.register')}</Link></li>
              <li><Link to="/jobs" className="hover:text-primary-500 transition">{t('jobs.title')}</Link></li>
              <li><Link to="/faq" className="hover:text-primary-500 transition">{t('footer.faq')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <FiMail className="text-primary-500" />
                <span className="text-sm">{t('footer.email')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiPhone className="text-primary-500" />
                <span className="text-sm">{t('footer.phone')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiMapPin className="text-primary-500" />
                <span className="text-sm">{t('footer.address')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
