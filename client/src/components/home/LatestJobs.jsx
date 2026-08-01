import { useEffect, useState } from 'react';
import api from '../../services/api';

const formatDisplayText = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return [value.city, value.region, value.country].filter(Boolean).join(', ');
  }
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const LatestJobs = () => {
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    const f = async () => {
      try {
        const res = await api.get('/jobs', { params: { limit: 9 } });
        setJobs(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch {}
    };
    f();
  }, []);

  return (
    <section className="latest-jobs py-2">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {jobs.map((j) => (
          <div key={j._id} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">New Opening</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900">{formatDisplayText(j.title) || 'Open Position'}</h4>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">Hot</span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">{formatDisplayText(j.company?.name) || 'Company Name'}</p>
            <p className="mt-2 text-sm text-slate-500">{formatDisplayText(j.location) || 'Remote / Hybrid'}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
export default LatestJobs;
