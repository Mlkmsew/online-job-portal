import { FiActivity, FiBookOpen, FiShield, FiSearch, FiArrowRight } from 'react-icons/fi';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const SkillAssessment = () => {
  const [showResults, setShowResults] = useState(true);

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Skill Assessment</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            Discover your strengths and get personalized job recommendations based on your current skills.
          </p>
        </div>
        <Link
          to="/dashboard/find-jobs"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-3 font-semibold shadow-lg hover:bg-emerald-700 transition"
        >
          <FiSearch className="w-4 h-4" /> Search Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="card p-6 border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-2xl bg-emerald-100 text-emerald-700 p-3">
                <FiActivity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Start assessment</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Measure your job readiness</h2>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Answer a quick series of questions about your experience, tools, and preferences to receive a tailored skills score and improvement plan.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-sm text-gray-500">Estimated completion</p>
                <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">5 minutes</p>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-sm text-gray-500">Topics covered</p>
                <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">10 skill areas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowResults(!showResults)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-white font-semibold hover:bg-teal-700 transition"
            >
              {showResults ? 'Refresh results' : 'Begin assessment'} <FiArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Technical Strengths', value: '82%', description: 'You are strong in frontend, backend and database fundamentals.' },
              { title: 'Communication', value: '72%', description: 'Your profile shows solid professional communication skills.' },
              { title: 'Career Fit', value: '89%', description: 'Well aligned with product and engineering roles.' },
              { title: 'Growth Areas', value: '68%', description: 'Improve interview readiness and job matching for senior roles.' },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.title}</h3>
                  <span className="text-xl font-black text-teal-600 dark:text-teal-400">{item.value}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-emerald-50 text-emerald-700 p-3">
                <FiBookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Tips</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prepare smarter</h3>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li>• Update your CV with current accomplishments.</li>
              <li>• Add measurable results and tools you used.</li>
              <li>• Practice answers for behavior and technical interviews.</li>
              <li>• Review job listings before starting the assessment.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-emerald-50 text-emerald-700 p-3">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Assessment security</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your answers are kept private and used only to improve your job matches on this portal.</p>
          </div>
        </aside>
      </div>

      {showResults && (
        <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest assessment results</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review the areas where your profile performs best and where you can improve.</p>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
            >
              Hide details
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Resume Quality', score: 86, description: 'Strong clarity and structure.' },
              { label: 'Skill Match', score: 78, description: 'Good fit with mid-level roles.' },
              { label: 'Interview Readiness', score: 71, description: 'Practice case-based questions to improve.' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className="text-lg font-black text-teal-600">{item.score}%</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillAssessment;
