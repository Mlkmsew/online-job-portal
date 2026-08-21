import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="site-footer py-6">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold">{t('footer.brandName', { defaultValue: 'Online Job' })}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('footer.brandTagline', { defaultValue: 'Connecting youth with work.' })}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('home.companyLabel', { defaultValue: 'Company' })}</h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400">
              <li>{t('nav.about', { defaultValue: 'About' })}</li>
              <li>{t('footer.careers', { defaultValue: 'Careers' })}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('footer.support', { defaultValue: 'Support' })}</h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400">
              <li>{t('footer.helpCenter', { defaultValue: 'Help Center' })}</li>
              <li>{t('nav.contact', { defaultValue: 'Contact' })}</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
