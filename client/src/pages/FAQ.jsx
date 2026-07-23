import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();
  const faqs = [
    { q: t('faq.question1'), a: t('faq.answer1') },
    { q: t('faq.question2'), a: t('faq.answer2') },
    { q: t('faq.question3'), a: t('faq.answer3') },
    { q: t('faq.question4'), a: t('faq.answer4') },
    { q: t('faq.question5'), a: t('faq.answer5') },
  ];

  return (
    <div className="section container-custom">
      <h1 className="heading-2 text-center mb-12">{t('faq.title')}</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="card">
            <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
            <p className="text-gray-600">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
