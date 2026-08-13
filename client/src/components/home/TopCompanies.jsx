import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import TrustedCompanyCard from './TrustedCompanyCard';

const TopCompanies = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const f = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/companies/trusted');
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCompanies(data);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || t('home.companiesError'));
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };
    f();
  }, [t]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {isLoading && (
        <div className="col-span-full grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-slate-100" />
              <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-2.5 w-1/2 rounded bg-slate-100" />
              <div className="mt-3 h-5 w-2/3 rounded-full bg-emerald-50" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-center shadow-sm">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && companies.length === 0 && (
        <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">{t('home.noCompaniesAvailable')}</p>
        </div>
      )}

      {!isLoading && !error &&
        companies.slice(0, 6).map((c) => <TrustedCompanyCard key={c._id} company={c} />)}
    </div>
  );
};

export default TopCompanies;