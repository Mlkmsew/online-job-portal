import { FiBookOpen, FiCheckCircle, FiZap, FiTrendingUp } from 'react-icons/fi';

const CareerResources = () => {
  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Career Resources</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">Find articles, interview guidance, resume tips, and courses to help you move faster in your job search.</p>
        </div>
        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Updated weekly</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: 'Resume Writing', description: 'Craft a CV that highlights your experience and gets noticed by recruiters.', icon: FiBookOpen },
          { title: 'Interview Prep', description: 'Use our checklist to stay confident before interviews.', icon: FiCheckCircle },
          { title: 'Career Growth', description: 'Learn how to position yourself for promotions and salary growth.', icon: FiTrendingUp },
          { title: 'Skill Development', description: 'Find online courses and practice plans tailored to your field.', icon: FiZap },
        ].map((resource) => {
          const Icon = resource.icon;
          return (
            <div key={resource.title} className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 text-emerald-700 p-3">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-900 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">Recommended</span>
              </div>
              <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{resource.title}</h2>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{resource.description}</p>
              <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                View Resource
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CareerResources;
