import { useTranslation } from 'react-i18next';

const Statistics = () => {
  const { t } = useTranslation();

  const statistics = [
    { key: 'totalJobs', value: '12,480+' },
    { key: 'activeSeekers', value: '89,420+' },
    { key: 'companies', value: '1,250+' },
    { key: 'successfulPlacements', value: '6,280+' },
  ];

  return (
    <section className="section bg-slate-950 text-white" aria-labelledby="statistics-heading">
      <div className="container-custom">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-300">{t('home.platformStatistics')}</p>
          <h2 id="statistics-heading" className="heading-2 mt-4 text-white">{t('home.trustedByThousands')}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {statistics.map((item) => (
            <div key={item.key} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-lg backdrop-blur-xl">
              <p className="text-4xl font-bold text-white">{item.value}</p>
              <p className="mt-3 text-sm text-slate-300">{t(`home.stat_${item.key}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
