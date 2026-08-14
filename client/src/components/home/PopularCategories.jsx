import { useEffect, useState } from 'react';
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
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiStar,
  FiTool,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import api from '../../services/api';

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

const PopularCategories = () => {
  const { t } = useTranslation();
  const [cats, setCats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

  const rendered = cats.length
    ? cats.slice(0, 12).map((category) => {
        const { component: IconComponent, emoji } = resolveCategoryIcon(category.icon);
        return {
          name: category.name,
          slug: category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || category._id,
          icon: emoji || '📌',
          IconComponent,
          description: category.description || t('home.exploreOpportunities'),
          jobs: `${category.jobCount ?? 0} ${t('home.jobsLabel')}`,
        };
      })
    : [];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {isLoading && (
        <div className="col-span-full rounded-3xl border border-gray-200 bg-white px-6 py-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.loadingCategories')}</p>
        </div>
      )}

      {error && (
        <div className="col-span-full rounded-3xl border border-red-200 bg-red-50 px-6 py-6 text-left shadow-sm">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && rendered.length === 0 && (
        <div className="col-span-full rounded-3xl border border-gray-200 bg-white px-6 py-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.noCategoriesAvailable')}</p>
        </div>
      )}

      {!isLoading && !error && rendered.map((category) => (
        <Link
          key={category.slug}
          to={`/jobs?category=${encodeURIComponent(category.slug)}`}
          className="group rounded-3xl border border-gray-200 bg-white px-6 py-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-2xl">
            {category.IconComponent ? <category.IconComponent className="h-6 w-6" /> : category.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{category.jobs}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PopularCategories;
