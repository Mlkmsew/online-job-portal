const CareerBlog = () => (
  <section className="career-blog py-2">
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {[
        {
          title: 'How to Write a Standout CV',
          snippet: 'Learn how to structure your experience and highlight your achievements clearly.',
        },
        {
          title: 'Interview Tips That Make an Impression',
          snippet: 'Prepare with practical advice to boost your confidence and answer better.',
        },
        {
          title: 'Top Skills Employers Want Right Now',
          snippet: 'See which capabilities are in demand across leading industries today.',
        },
      ].map((item) => (
        <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-lg">✍️</div>
          <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.snippet}</p>
        </article>
      ))}
    </div>
  </section>
);
export default CareerBlog;
