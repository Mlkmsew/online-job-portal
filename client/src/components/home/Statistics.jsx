const statistics = [
  { label: 'Total Jobs', value: '12,480+' },
  { label: 'Active Job Seekers', value: '89,420+' },
  { label: 'Companies', value: '1,250+' },
  { label: 'Successful Placements', value: '6,280+' },
];

const Statistics = () => {
  return (
    <section className="section bg-slate-950 text-white" aria-labelledby="statistics-heading">
      <div className="container-custom">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-300">Platform Statistics</p>
          <h2 id="statistics-heading" className="heading-2 mt-4 text-white">Trusted by thousands of job seekers and employers</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {statistics.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-lg backdrop-blur-xl">
              <p className="text-4xl font-bold text-white">{item.value}</p>
              <p className="mt-3 text-sm text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
