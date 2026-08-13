import { useTranslation } from 'react-i18next';

const CareerBlog = () => {
  const { t } = useTranslation();

  const articles = [
    {
      key: 'cvTips',
      emoji: '✍️',
    },
    {
      key: 'interviewTips',
      emoji: '✍️',
    },
    {
      key: 'topSkills',
      emoji: '✍️',
    },
  ];

  return (
    <section className="career-blog py-2">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {articles.map((item) => (
          <article key={item.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-lg">{item.emoji}</div>
            <h4 className="text-lg font-semibold text-slate-900">{t(`home.blog_${item.key}_title`)}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t(`home.blog_${item.key}_snippet`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
export default CareerBlog;
