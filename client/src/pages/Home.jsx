// ============================================
// Home Page - Landing Experience (Light Theme & Cityscape Hero)
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch, FiMapPin, FiChevronRight, FiBriefcase, FiFileText,
  FiUsers, FiStar, FiCode, FiTrendingUp, FiHeart, FiBookOpen,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PopularCategories from '../components/home/PopularCategories';
import Statistics from '../components/home/Statistics';
import LatestJobs from '../components/home/LatestJobs';
import TopCompanies from '../components/home/TopCompanies';
import CareerBlog from '../components/home/CareerBlog';
import SuccessStories from '../components/home/SuccessStories';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import Newsletter from '../components/home/Newsletter';
import CTA from '../components/home/CTA';

const popularSearchKeys = [
  { key: 'softwareEngineer', searchValue: 'Software Engineer', icon: FiCode },
  { key: 'accountant', searchValue: 'Accountant', icon: FiTrendingUp },
  { key: 'nurse', searchValue: 'Nurse', icon: FiHeart },
  { key: 'teacher', searchValue: 'Teacher', icon: FiBookOpen },
  { key: 'ngoOfficer', searchValue: 'NGO Officer', icon: FiBriefcase },
];

const Home = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCompanies: 0,
    activeSeekers: 0,
    jobsThisWeek: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeStats = async () => {
      try {
        const [jobsRes, companiesRes] = await Promise.all([
          api.get('/jobs/stats/overview'),
          api.get('/companies?isApproved=true&limit=1'),
        ]);

        const totalJobs = jobsRes.data?.data?.overview?.total ?? 0;
        const totalCompanies = companiesRes.data?.pagination?.total ?? companiesRes.data?.count ?? 0;

        setStats({
          totalJobs,
          totalCompanies,
          activeSeekers: totalJobs > 0 ? Math.max(totalJobs, 1) : 1,
          jobsThisWeek: totalJobs > 0 ? Math.max(totalJobs, 1) : 1,
        });
      } catch (error) {
        console.error('Failed to load home statistics:', error);
      }
    };

    loadHomeStats();
  }, []);

  const featureCardTitle = t('home.featureCardTitle', { defaultValue: 'Build a stronger career in Ethiopia' });
  const featureCardSubtitle = t('home.featureCardSubtitle', {
    defaultValue: 'Discover credible employers, browse fresh opportunities, and take the next step in your professional journey.',
  });

  const handleSearch = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (location.trim()) params.set('location', location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const handleQuickSearch = (value) => {
    setKeyword(value);
    navigate(`/jobs?search=${encodeURIComponent(value)}`);
  };

  return (
    <div className="space-y-6 md:space-y-10 bg-slate-50/50 min-h-screen">
      {/* ═════════════════════════════════════════════════════════════════════
          HERO SECTION — Light Theme with Cityscape Background (Image 2)
         ═════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-24">
        {/* Cityscape Background Image & Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/background.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/40" />

        {/* Vector Grid Dots */}
        <div className="absolute top-6 left-6 pointer-events-none opacity-20 hidden sm:block">
          <div className="grid grid-cols-6 gap-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            ))}
          </div>
        </div>
        <div className="absolute top-12 right-12 pointer-events-none opacity-20 hidden lg:block">
          <div className="grid grid-cols-6 gap-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            ))}
          </div>
        </div>

        <div className="container-custom relative z-10 px-6 sm:px-12 lg:px-16">
          <div className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr] items-center">
            
            {/* Left Content Column */}
            <div className="max-w-2xl space-y-6">
              
              {/* Hero badge removed per request */}

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                {t('home.heroTitle')}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg font-medium text-slate-600 max-w-xl">
                {t('home.heroSubtitle')}
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-8 grid gap-3 sm:grid-cols-[1.3fr_1fr_auto] items-center">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" aria-hidden="true" />
                  <input
                    id="hero-search-keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="relative">
                  <FiMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" aria-hidden="true" />
                  <input
                    id="hero-search-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('home.locationPlaceholder')}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <span>{t('home.searchButton')}</span>
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </form>

              {/* Popular Searches */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 tracking-wide uppercase mr-1">{t('home.popularSearches')}:</span>
                {popularSearchKeys.map((item) => {
                  const TagIcon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleQuickSearch(item.searchValue)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700"
                    >
                      <TagIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                      <span>{t(`home.${item.key}`)}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Right Side — People Only (No Image Background) */}
            <motion.div
              className="relative flex items-end justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <img
                src="/images/hero-team-cutout.png"
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/hero-team-cutout.png'; }}
                alt="Ethiopian Professionals Collaborating"
                className="w-full max-w-lg xl:max-w-xl h-auto object-contain drop-shadow-xl transition-transform duration-500 hover:scale-[1.02]"
              />
            </motion.div>

          </div>
        </div>
      </section>



      <section className="section bg-slate-50" aria-labelledby="categories-heading">
        <div className="container-custom">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">{t('home.exploreByCategory')}</p>
              <h2 id="categories-heading" className="heading-2 mt-3">{t('home.popularCategories')}</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
                {t('home.categoriesSubtitle')}
              </p>
            </div>
            <Link to="/jobs" className="btn btn-outline">
              {t('home.viewAllJobs')}
            </Link>
          </div>

          <PopularCategories />
        </div>
      </section>

      {/* Featured jobs and the large search component removed from public home */}

      <section className="section bg-white" aria-labelledby="latest-heading">
        <div className="container-custom">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">{t('home.latest')}</p>
              <h2 id="latest-heading" className="heading-2 mt-2">{t('home.latestJobs')}</h2>
            </div>
            <CTA />
          </div>
          <LatestJobs />
        </div>
      </section>

      <section className="section bg-slate-50" aria-labelledby="trusted-companies-heading">
        <div className="container-custom">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">{t('home.trustedCompaniesSubtitle')}</p>
              <h2 id="trusted-companies-heading" className="heading-2 mt-3">{t('home.trustedCompanies')}</h2>
            </div>
            <Link to="/companies" className="btn btn-outline">
              {t('home.allCompanies')}
            </Link>
          </div>
          <TopCompanies />
        </div>
      </section>

      <section className="section bg-white" aria-label="Career blog">
        <div className="container-custom">
          <CareerBlog />
        </div>
      </section>

      <section className="section bg-slate-50" aria-label="Success stories">
        <div className="container-custom">
          <SuccessStories />
        </div>
      </section>

      <section className="section bg-white" aria-label="Testimonials">
        <div className="container-custom">
          <Testimonials />
        </div>
      </section>

      <section className="section bg-slate-50" aria-label="FAQ and newsletter">
        <div className="container-custom grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FAQ />
          </div>
          <div className="lg:col-span-1">
            <Newsletter />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
