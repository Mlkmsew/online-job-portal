import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="notfound-page dark:bg-[#0B1220]">
      <div className="notfound-card dark:bg-gray-900">
        <h2>{t('common.pageNotFound', { defaultValue: 'Page Not Found' })}</h2>
        <p>{t('common.pageNotFoundMessage', { defaultValue: "We couldn't find the page you're looking for." })}</p>
        <Link to="/" className="btn btn-secondary">{t('common.backToHome', { defaultValue: 'Back to Home' })}</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
