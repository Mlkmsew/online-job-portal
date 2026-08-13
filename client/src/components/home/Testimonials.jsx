import { useTranslation } from 'react-i18next';

const Testimonials = () => {
  const { t } = useTranslation();

  return (
    <section className="testimonials py-6">
      <h3 className="heading-3 mb-4">{t('home.testimonialsTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">{t('home.testimonial1')}</div>
        <div className="card p-4">{t('home.testimonial2')}</div>
        <div className="card p-4">{t('home.testimonial3')}</div>
      </div>
    </section>
  );
};
export default Testimonials;
