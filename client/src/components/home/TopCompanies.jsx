import { useEffect, useState } from 'react';
import api from '../../services/api';

const formatDisplayText = (value) => {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const TopCompanies = () => {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    const f = async () => {
      try {
        const res = await api.get('/companies?isApproved=true');
        setCompanies(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch {}
    };
    f();
  }, []);

  return (
    <section className="top-companies py-2">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {companies.slice(0, 6).map((c) => (
          <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
              {(c.name || 'C').charAt(0).toUpperCase()}
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{formatDisplayText(c.name) || 'Company'}</h4>
            <p className="mt-2 text-xs text-slate-500">{c.industry || 'Hiring now'}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
export default TopCompanies;
