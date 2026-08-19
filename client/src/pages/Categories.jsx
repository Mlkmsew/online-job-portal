import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiBriefcase,
  FiActivity,
  FiAward,
  FiBookOpen,
  FiCamera,
  FiClipboard,
  FiCode,
  FiCoffee,
  FiCpu,
  FiDollarSign,
  FiFilm,
  FiGlobe,
  FiHeart,
  FiHome,
  FiLayers,
  FiMapPin,
  FiMic,
  FiMonitor,
  FiMusic,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiStar,
  FiTool,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiZap,
  FiArrowRight,
  FiLoader,
} from 'react-icons/fi';
import api from '../services/api';

const iconMap = {
  briefcase: FiBriefcase,
  activity: FiActivity,
  award: FiAward,
  'book-open': FiBookOpen,
  book: FiBookOpen,
  camera: FiCamera,
  clipboard: FiClipboard,
  code: FiCode,
  coffee: FiCoffee,
  cpu: FiCpu,
  'dollar-sign': FiDollarSign,
  film: FiFilm,
  globe: FiGlobe,
  heart: FiHeart,
  home: FiHome,
  layers: FiLayers,
  'map-pin': FiMapPin,
  mic: FiMic,
  monitor: FiMonitor,
  music: FiMusic,
  shield: FiShield,
  'shopping-bag': FiShoppingBag,
  smartphone: FiSmartphone,
  star: FiStar,
  tool: FiTool,
  'trending-up': FiTrendingUp,
  truck: FiTruck,
  users: FiUsers,
  zap: FiZap,
};

const resolveCategoryIcon = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return { component: FiBriefcase, emoji: '' };
  if (/[^\u0000-\u007F]/.test(raw)) return { component: null, emoji: raw };
  return { component: iconMap[raw.toLowerCase()] || FiBriefcase, emoji: '' };
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const Categories = () => {
  const { t } = useTranslation();
  const [cats, setCats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/categories');
        const categories = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCats(categories);
      } catch (err) {
        setError(err.response?.data?.message || err.message || t('home.categoriesLoadError'));
        setCats([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [t]);

  const totalJobs = useMemo(
    () => cats.reduce((sum, c) => sum + (c.jobCount ?? 0), 0),
    [cats]
  );

  const filtered = useMemo(() => {
    if (!query) return cats;
    const q = query.toLowerCase();
    return cats.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const desc = String(c.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [cats, query]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 lg:pb-24">
      <div className="container-custom">
        {/* ===== PAGE HEADER ===== */}
        <div className="pt-10 text-center lg:pt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            {t('nav.categories', { defaultValue: 'Categories' })}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
            {t('categoriesPage.title', { defaultValue: 'Browse Job Categories' })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {t('categoriesPage.subtitle', {
              defaultValue: 'Explore all industry categories and find the roles that match your skills.',
            })}
          </p>
        </div>

        {/* ===== SEARCH ===== */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#E6EEF1] bg-white p-5 shadow-lg sm:p-6"
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
              <FiSearch className="h-5 w-5" aria-hidden="true" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder={t('categoriesPage.searchPlaceholder', { defaultValue: 'Search categories...' })}
              aria-label={t('categoriesPage.searchPlaceholder', { defaultValue: 'Search categories...' })}
              className="w-full rounded-xl border border-[#D8E2DF] bg-white py-3 pl-12 pr-4 text-sm text-[#0F172A] placeholder:text-[#8FA0AF] transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </form>

        {/* ===== COUNT ===== */}
        {!isLoading && !error && (
          <p className="mt-6 text-center text-sm text-slate-500">
            {t('categoriesPage.showingCount', { defaultValue: 'Showing' })} {filtered.length}{' '}
            {t('categoriesPage.categoriesLabel', { defaultValue: 'categories' })}{' '}
            {t('categoriesPage.ofJobs', { defaultValue: 'with' })} {totalJobs}{' '}
            {t('home.jobsLabel', { defaultValue: 'jobs' })}
          </p>
        )}

        {/* ===== CATEGORIES GRID ===== */}
        {isLoading && (
          <div className="mt-10 flex items-center justify-center gap-2 py-20 text-slate-500">
            <FiLoader className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
            {t('home.loadingCategories', { defaultValue: 'Loading categories...' })}
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-[#E6EEF1] bg-white py-16 text-center text-slate-500">
            {query
              ? t('categoriesPage.noSearchResults', { defaultValue: 'No categories match your search.' })
              : t('home.noCategoriesAvailable', { defaultValue: 'No job categories are available right now.' })}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((category) => {
              const { component: IconComponent, emoji } = resolveCategoryIcon(category.icon);
              const name = category.name;
              const slug = category.slug || slugify(name) || category._id;
              const jobs = category.jobCount ?? 0;
              return (
                <Link
                  key={category._id || slug}
                  to={`/jobs?category=${encodeURIComponent(slug)}`}
                  className="group flex flex-col rounded-2xl border border-[#E6EEF1] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    {IconComponent ? <IconComponent className="h-6 w-6" aria-hidden="true" /> : <span aria-hidden="true">{emoji}</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A] transition-colors group-hover:text-blue-600">
                    {name}
                  </h3>
                  {category.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{category.description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                    <FiBriefcase className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    {jobs} {t('home.jobsLabel', { defaultValue: 'jobs' })}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    {t('categoriesPage.browseJobs', { defaultValue: 'Browse Jobs' })}
                    <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;