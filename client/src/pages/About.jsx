import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="section container-custom">
      <div className="max-w-4xl mx-auto">
        <h1 className="heading-2 mb-6">{t('about.title')}</h1>
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">{t('about.descriptionTitle', 'Description')}</h3>
          <p>{t('about.description')}</p>
          <h3 className="text-xl font-semibold">{t('about.missionTitle')}</h3>
          <p>{t('about.missionText')}</p>
          <h3 className="text-xl font-semibold">{t('about.visionTitle')}</h3>
          <p>{t('about.visionText')}</p>
        </div>
      </div>
    </div>
  );
};

export default About;
