import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();

  return (
    <section className="faq py-6">
      <h3 className="heading-3 mb-4">{t('home.faqSectionTitle')}</h3>
      <div className="space-y-3">
        <div className="p-3 border rounded">{t('home.faqShort1')}</div>
        <div className="p-3 border rounded">{t('home.faqShort2')}</div>
      </div>
    </section>
  );
};

export default FAQ;
