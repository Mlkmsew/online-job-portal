import { FiBookOpen, FiCheckCircle, FiZap, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CareerResources = () => {
  const resources = [
    {
      title: 'Resume writing guide',
      description: 'Learn how to build a powerful CV that highlights your strengths and gets noticed by recruiters.',
      tag: 'Resume',
      path: '/dashboard/profile',
      icon: FiBookOpen,
    },
    {
      title: 'Interview preparation checklist',
      description: 'Practice answers, follow-up messages, and confidence strategies for every stage.',
      tag: 'Interview',
      path: '/dashboard/applications',
      icon: FiCheckCircle,
    },
    {
      title: 'Skill development plan',
      description: 'Focus on the most in-demand skills and track improvement over time.',
      tag: 'Skills',
      path: '/dashboard/skill-assessment',
      icon: FiZap,
    },
    {
      title: 'Career growth roadmap',
      description: 'Identify the next role, refine your targets, and stay motivated through the job search.',
      tag: 'Growth',
      path: '/dashboard/settings',
      icon: FiTrendingUp,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Career resources</p>
            <h1 className="mt-4 text-4xl font-black text-slate-900 dark:text-white">Train smarter and move confidently toward your next role.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Browse curated tools, articles, and guides designed to support each stage of your job search.</p>
          </div>
          <div className="rounded-full border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">Updated weekly</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Your learning toolkit</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Quickly access guides, checklists, and actions that help you improve applications and interviews.</p>

          <div className="mt-8 space-y-4">
            {[
              { label: 'Resume review checklist', value: '5 steps to sharper formatting and clarity' },
              { label: 'Interview follow-up templates', value: 'Write thoughtful messages after every call' },
              { label: 'Skill gap suggestions', value: 'Identify the strongest areas to highlight' },
              { label: 'Job search planning', value: 'Map your search cadence and priority targets' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {resources.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.path}
                className="group block rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#1769E0] hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-gray-900 dark:text-slate-300">{item.tag}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <span>Explore</span>
                  <FiArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CareerResources;
