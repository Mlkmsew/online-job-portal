import { useTranslation } from 'react-i18next';

const Newsletter = () => {
  const { t } = useTranslation();

  return (
    <section className="newsletter py-6">
      <div className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="heading-3">{t('home.newsletterTitle')}</h3>
          <p className="text-sm text-gray-500">{t('home.newsletterText')}</p>
        </div>
        <div className="mt-3 md:mt-0">
          <input placeholder={t('home.newsletterEmailPlaceholder')} className="input mr-2" />
          <button className="btn btn-primary">{t('home.newsletterButton')}</button>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
