import { useTranslation } from 'react-i18next';

const CTA = () => {
  const { t } = useTranslation();

  return (
    <section className="cta py-6">
      <div className="card p-6 text-center">
        <h3 className="text-xl font-semibold">{t('home.ctaTitle')}</h3>
        <div className="mt-4">
          <a href="/register" className="btn btn-primary mr-3">{t('home.ctaCreateAccount')}</a>
          <a href="/jobs" className="btn btn-secondary">{t('home.ctaBrowseJobs')}</a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
