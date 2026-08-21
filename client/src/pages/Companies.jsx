// ============================================
// Companies Page - OnlineJob Portal
// Dedicated page for Featured + All Companies with search & pagination
// ============================================
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiArrowRight,
  FiLoader,
} from 'react-icons/fi';
import api from '../services/api';

const PAGE_SIZE = 8;

const formatCompanyLocation = (company) => {
  const raw = company.address || company.location;
  if (raw && typeof raw === 'object') {
    return [raw.city, raw.region].filter(Boolean).join(', ') || raw.address || 'Addis Ababa';
  }
  return raw || 'Addis Ababa';
};

const LogoAvatar = ({ logo, name, className = 'h-12 w-12 rounded-xl' }) => {
  const [failed, setFailed] = useState(false);
  const hasLogo = !!logo && !failed;
  if (!hasLogo) {
    return (
      <span className={`flex flex-none items-center justify-center ${className} bg-[#EAF2FE] dark:bg-blue-900/25 text-base font-bold text-[#1769E0] dark:text-blue-400`}>
        {(name || 'C').charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
      className={`${className} flex-none bg-white dark:bg-gray-900 object-contain object-center`}
    />
  );
};

const CompanyCard = ({ company }) => {
  const { t } = useTranslation();
  return (
  <div className="group flex flex-col rounded-2xl border border-[#E6EEF1] dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#BFDBFE] hover:shadow-xl">
    <div className="flex items-center gap-4">
      <LogoAvatar logo={company.logo} name={company.name} className="h-14 w-14 rounded-xl" />
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold text-[#0F1F33] dark:text-gray-100 transition-colors group-hover:text-[#1769E0] dark:group-hover:text-blue-400">
          {company.name}
        </h3>
        <p className="text-sm font-medium text-[#536273] dark:text-gray-400">{company.industry}</p>
      </div>
    </div>
    <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#536273] dark:text-gray-400">
      <FiMapPin className="h-4 w-4 text-[#1769E0] dark:text-blue-400" aria-hidden="true" />
      {company.location}
    </p>
    <div className="mt-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FE] dark:bg-blue-900/25 px-3 py-1 text-xs font-bold text-[#1769E0] dark:text-blue-400">
        <FiBriefcase className="h-3.5 w-3.5" aria-hidden="true" />
        {company.openPositions} {t('companies.openPositions', { defaultValue: 'Open Positions' })}
      </span>
    </div>
    <Link
      to={`/companies/${company.id}`}
      className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-[#1769E0] py-2.5 text-sm font-semibold text-[#1769E0] dark:text-blue-400 transition hover:bg-[#1769E0] hover:text-white"
    >
      {t('companies.viewCompany', { defaultValue: 'View Company' })}
      <FiArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </div>
  );
};

const Companies = () => {
  const { t } = useTranslation();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search / filter state
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies', { params: { isApproved: true } });
        const real = (Array.isArray(res.data) ? res.data : res.data?.data || []).map((c) => ({
          id: c._id || c.id,
          name: c.name,
          industry: c.industry || 'General',
          location: formatCompanyLocation(c),
          openPositions: c.openPositions ?? 0,
          logo: c.logo || '',
        }));
        setCompanies(real);
      } catch (error) {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const industries = useMemo(
    () => [...new Set(companies.map((c) => c.industry))].sort(),
    [companies]
  );
  const locations = useMemo(
    () => [...new Set(companies.map((c) => c.location))].sort(),
    [companies]
  );

  const filtered = useMemo(
    () =>
      companies.filter((c) => {
        const nameOk = !query || c.name.toLowerCase().includes(query.toLowerCase());
        const industryOk = !industry || c.industry === industry;
        const locationOk =
          !location || (c.location || '').toLowerCase().includes(location.toLowerCase());
        return nameOk && industryOk && locationOk;
      }),
    [companies, query, industry, location]
  );

  const featured = useMemo(() => {
    const withLogos = companies.filter((c) => c.logo).slice(0, 6);
    return withLogos.length >= 4 ? withLogos : companies.slice(0, 6);
  }, [companies]);

  const handleSearch = (e) => {
    e.preventDefault();
    setVisibleCount(PAGE_SIZE);
  };

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-[#F3F9F7] dark:bg-[#0B1220] pb-16 lg:pb-24">
      <div className="container-custom">
        {/* ===== PAGE HEADER ===== */}
        <div className="pt-10 text-center lg:pt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1769E0]">
            {t('companies.eyebrow', { defaultValue: 'Employers' })}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F1F33] dark:text-gray-100 sm:text-4xl">
            {t('companies.title', { defaultValue: 'Companies' })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#536273] dark:text-gray-400 sm:text-lg">
            {t('companies.subtitle', {
              defaultValue: 'Explore companies and discover your next career opportunity.',
            })}
          </p>
        </div>

        {/* ===== SEARCH / FILTER ===== */}
        <form
          onSubmit={handleSearch}
          className="mt-8 rounded-2xl border border-[#E6EEF1] dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-lg sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1769E0] dark:text-blue-400">
                <FiSearch className="h-5 w-5" aria-hidden="true" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder={t('companies.searchName', { defaultValue: 'Search company name...' })}
                className="w-full rounded-xl border border-[#D8E2DF] dark:border-gray-700 bg-white dark:bg-gray-900 py-3 pl-12 pr-4 text-sm text-[#0F1F33] dark:text-gray-100 placeholder:text-[#8FA0AF] dark:placeholder:text-gray-500 transition focus:border-[#1769E0] focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20"
              />
            </div>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2DF] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-[#0F1F33] dark:text-gray-100 transition focus:border-[#1769E0] focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20"
            >
              <option value="">{t('companies.allIndustries', { defaultValue: 'All Industries' })}</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2DF] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-[#0F1F33] dark:text-gray-100 transition focus:border-[#1769E0] focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20"
            >
              <option value="">{t('companies.allLocations', { defaultValue: 'All Locations' })}</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1769E0] to-[#0D4FB0] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:brightness-110"
            >
              <FiSearch className="h-4 w-4" aria-hidden="true" />
              {t('companies.search', { defaultValue: 'Search' })}
            </button>
          </div>
        </form>

        {/* ===== FEATURED COMPANIES ===== */}
        <section className="mt-12 lg:mt-16">
          <h2 className="text-2xl font-extrabold text-[#0F1F33] dark:text-gray-100 sm:text-3xl">
            {t('companies.featured', { defaultValue: 'Featured Companies' })}
          </h2>
          <span className="mt-3 block h-1 w-14 rounded-full bg-[#1769E0]" aria-hidden="true" />

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[#536273] dark:text-gray-400">
              <FiLoader className="h-5 w-5 animate-spin text-[#1769E0]" aria-hidden="true" />
              {t('common.loading', { defaultValue: 'Loading...' })}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </section>

        {/* ===== COMPANY DIRECTORY ===== */}
        <section className="mt-12 lg:mt-16">
          <h2 className="text-2xl font-extrabold text-[#0F1F33] dark:text-gray-100 sm:text-3xl">
            {t('companies.allCompanies', { defaultValue: 'All Companies' })}
          </h2>
          <span className="mt-3 block h-1 w-14 rounded-full bg-[#1769E0]" aria-hidden="true" />
          <p className="mt-4 text-sm text-[#536273] dark:text-gray-400">
            {t('companies.showingCount', { defaultValue: 'Showing' })} {visible.length} of {filtered.length}{' '}
            {t('companies.companiesLabel', { defaultValue: 'companies' })}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>

          {!loading && visible.length === 0 && (
            <div className="mt-12 rounded-2xl border border-[#E6EEF1] dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center text-[#536273] dark:text-gray-400">
              {t('companies.noResults', { defaultValue: 'No companies match your search.' })}
            </div>
          )}

          {hasMore && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#1769E0] px-8 py-3.5 text-sm font-semibold text-[#1769E0] dark:text-blue-400 transition hover:bg-[#EAF2FE] dark:hover:bg-blue-900/25"
              >
                {t('companies.loadMore', { defaultValue: 'Load More Companies' })}
                <FiArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Companies;