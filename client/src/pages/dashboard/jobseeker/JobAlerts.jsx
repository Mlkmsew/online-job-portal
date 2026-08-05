import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiPlus, FiChevronRight, FiTrash2, FiClock, FiInfo, FiX } from 'react-icons/fi';
import { getJobAlerts, createJobAlert, updateJobAlert, deleteJobAlert } from '../../../services/jobSearchService';
import toast from 'react-hot-toast';

const JobAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    keywords: '',
    region: '',
    city: '',
    jobType: '',
    frequency: 'daily',
    active: true,
  });

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await getJobAlerts();
      setAlerts(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load job alerts:', err);
      toast.error('Unable to load your job alerts right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAlert = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.keywords.trim()) {
      toast.error('Please provide a title and keywords for this alert.');
      return;
    }

    setSaving(true);
    try {
      await createJobAlert(form);
      toast.success('Job alert created successfully.');
      setIsFormOpen(false);
      setForm({ title: '', keywords: '', region: '', city: '', jobType: '', frequency: 'daily', active: true });
      await loadAlerts();
    } catch (err) {
      console.error('Failed to create job alert:', err);
      toast.error(err.response?.data?.message || 'Could not create job alert.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      const res = await updateJobAlert(alert._id, { ...alert, active: !alert.active });
      setAlerts((prev) => prev.map((item) => (item._id === alert._id ? res.data?.data || res.data || item : item)));
      toast.success(`Alert ${alert.active ? 'paused' : 'enabled'}.`);
    } catch (err) {
      console.error('Failed to update job alert:', err);
      toast.error('Unable to update alert status.');
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await deleteJobAlert(id);
      toast.success('Job alert deleted.');
      setAlerts((prev) => prev.filter((alert) => alert._id !== id));
    } catch (err) {
      console.error('Failed to delete job alert:', err);
      toast.error('Could not delete this alert.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Job Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            Create alerts for your favorite roles and locations so new opportunities come to you first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-3 font-semibold shadow-lg hover:bg-emerald-700 transition"
        >
          <FiPlus className="w-4 h-4" /> Create Alert
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
        <section className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your active alerts</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stay ahead of new opportunities tailored to your search preferences.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {loading ? 'Loading...' : `${alerts.length} alert${alerts.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-3xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 animate-pulse" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-slate-50 p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <FiInfo className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No job alerts yet</h3>
              <p className="mt-3 text-sm">Create alerts for roles, locations, and keywords that matter most to you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert._id} className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 transition hover:border-emerald-300 hover:shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{alert.title}</p>
                      <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{alert.keywords || 'Job keywords'} — {alert.region || 'Any region'}{alert.city ? `, ${alert.city}` : ''}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${alert.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {alert.active ? 'Active' : 'Paused'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-gray-900 dark:text-gray-300">
                        {alert.frequency || 'Daily'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>Type: {alert.jobType || 'Any role'}</span>
                    <span>Region: {alert.region || 'Any'}</span>
                    <span>City: {alert.city || 'Any'}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAlert(alert)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      {alert.active ? 'Pause alert' : 'Enable alert'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(alert._id)}
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-2xl bg-emerald-50 text-emerald-700 p-3">
                <FiBell className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">Tips</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Build smarter alerts</h3>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li>• Keep alert titles short and clear.</li>
              <li>• Add location details only when relevant.</li>
              <li>• Use keyword phrases employers commonly include.</li>
              <li>• Pause alerts when you want fewer updates.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">Next step</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keep searches relevant</h3>
              </div>
              <FiClock className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review your active alerts every few weeks and refine keywords after you apply to similar roles.</p>
            <Link to="/dashboard/find-jobs" className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Explore matching jobs
            </Link>
          </div>
        </aside>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create a new job alert</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when matching roles are posted.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  Alert title
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    className="input"
                    placeholder="Software Engineer Addis Ababa"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  Keywords
                  <input
                    name="keywords"
                    value={form.keywords}
                    onChange={handleFormChange}
                    className="input"
                    placeholder="React, Node.js, remote"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  Region
                  <input
                    name="region"
                    value={form.region}
                    onChange={handleFormChange}
                    className="input"
                    placeholder="Addis Ababa"
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleFormChange}
                    className="input"
                    placeholder="Bole"
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  Job type
                  <select name="jobType" value={form.jobType} onChange={handleFormChange} className="select">
                    <option value="">Any type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  Frequency
                  <select name="frequency" value={form.frequency} onChange={handleFormChange} className="select">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  Active
                  <select name="active" value={String(form.active)} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.value === 'true' }))} className="select">
                    <option value="true">Enabled</option>
                    <option value="false">Paused</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
                  {saving ? 'Saving...' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAlerts;
