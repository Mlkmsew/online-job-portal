import { useState } from 'react';
import { FiBell, FiPlus, FiSearch, FiAlertTriangle } from 'react-icons/fi';

const defaultAlerts = [
  { id: 1, keyword: 'Software Engineer', location: 'Addis Ababa', frequency: 'Daily', active: true },
  { id: 2, keyword: 'Data Analyst', location: 'Remote', frequency: 'Weekly', active: false },
  { id: 3, keyword: 'UI/UX Designer', location: 'Hybrid', frequency: 'Daily', active: true },
];

const JobAlerts = () => {
  const [alerts, setAlerts] = useState(defaultAlerts);

  const toggleAlert = (id) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, active: !alert.active } : alert)));
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Job Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            Create alerts to get notified when new jobs match your skills and preferred locations.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-3 font-semibold shadow-lg hover:bg-emerald-700 transition">
          <FiPlus className="w-4 h-4" /> Create Alert
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="rounded-2xl bg-emerald-50 text-emerald-700 p-3">
              <FiBell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your active alerts</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Keep track of the jobs you care about most.</p>
            </div>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-300 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Alert</p>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{alert.keyword} — {alert.location}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${alert.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {alert.active ? 'Enabled' : 'Paused'}
                    </span>
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className="text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      {alert.active ? 'Pause' : 'Enable'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Frequency: {alert.frequency}</span>
                  <span>Status: {alert.active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Alert setup tips</h3>
            <ul className="space-y-3 text-gray-500 dark:text-gray-400 text-sm">
              <li>• Use specific keywords for higher relevance.</li>
              <li>• Select locations where you can commute or work remotely.</li>
              <li>• Pause alerts as needed to avoid repeated notifications.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-2xl bg-yellow-50 text-yellow-700 p-3">
                <FiAlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Stay in control</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">You can manage your alerts from this page at any time, and adjust preferences for daily or weekly summaries.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default JobAlerts;
