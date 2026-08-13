import { useTranslation } from 'react-i18next';

const SuccessStories = () => {
  const { t } = useTranslation();

  return (
    <section className="success-stories py-6">
      <h3 className="heading-3 mb-4">{t('home.successStoriesTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">{t('home.successStory1')}</div>
        <div className="card p-4">{t('home.successStory2')}</div>
      </div>
    </section>
  );
};
export default SuccessStories;
