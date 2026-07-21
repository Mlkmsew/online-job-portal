// ============================================
// Home Page - Landing Experience
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiMapPin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PopularCategories from '../components/home/PopularCategories';
import FeaturedJobs from '../components/home/FeaturedJobs';
import Statistics from '../components/home/Statistics';
import AnimatedSearch from '../components/home/AnimatedSearch';
import LatestJobs from '../components/home/LatestJobs';
import TopCompanies from '../components/home/TopCompanies';
import CareerBlog from '../components/home/CareerBlog';
import SuccessStories from '../components/home/SuccessStories';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import Newsletter from '../components/home/Newsletter';
import CTA from '../components/home/CTA';

const popularKeywords = [
  'Software Engineer',
  'Accountant',
  'Nurse',
  'Teacher',
  'NGO Officer',
];

const Home = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState({ totalJobs: 0, totalCompanies: 0 });
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

        setStats({ totalJobs, totalCompanies });
      } catch (error) {
        console.error('Failed to load home statistics:', error);
      }
    };

    loadHomeStats();
  }, []);

  const summaries = [
    { label: t('home.totalJobs'), value: stats.totalJobs.toLocaleString() },
    { label: t('home.companies'), value: stats.totalCompanies.toLocaleString() },
  ];

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
    <div className="space-y-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-slate-950 text-white">
        <div className="container-custom relative py-20 lg:py-24">
          <div className="grid gap-10 xl:grid-cols-[1.2fr_0.9fr] items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                {t('home.heroBadge')}
              </span>
              <h1 className="heading-1 mt-6 max-w-3xl text-white">{t('home.heroTitle')}</h1>
              <p className="mt-6 text-lg text-white/80 max-w-2xl">
                {t('home.heroSubtitle')}
              </p>

              <form onSubmit={handleSearch} className="mt-10 grid gap-4 sm:grid-cols-[1.6fr_1fr_auto]">
                <label htmlFor="hero-search-keyword" className="sr-only">
                  {t('home.searchPlaceholder')}
                </label>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60" aria-hidden="true" />
                  <input
                    id="hero-search-keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="input bg-white/10 placeholder:text-white/60 text-white pl-11"
                  />
                </div>

                <div className="relative">
                  <FiMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60" aria-hidden="true" />
                  <input
                    id="hero-search-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('home.locationPlaceholder')}
                    className="input bg-white/10 placeholder:text-white/60 text-white pl-11"
                  />
                </div>

                <button type="submit" className="btn btn-secondary px-8 py-3 text-base font-semibold">
                  {t('home.searchButton')}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{t('home.popular')}</span>
                {popularKeywords.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl min-h-[520px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.22),_transparent_30%)]" />
                <div className="relative h-full p-8">
                  <div className="h-full rounded-[1.75rem] bg-slate-900/75 p-6 text-white flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="h-10 w-10 rounded-2xl bg-white/10" />
                      <h2 className="text-2xl font-semibold">{t('home.featureCardTitle')}</h2>
                      <p className="text-sm text-white/70 max-w-xl">
                        {t('home.featureCardSubtitle')}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <p className="text-3xl font-bold text-white">{stats.totalJobs.toLocaleString()}</p>
                        <p className="mt-2 text-sm text-white/70">{t('home.liveJobs')}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <p className="text-3xl font-bold text-white">{stats.totalCompanies.toLocaleString()}</p>
                        <p className="mt-2 text-sm text-white/70">{t('home.approvedCompanies')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section bg-white" aria-label="Platform statistics">
        <div className="container-custom">
          <div className="grid gap-6 md:grid-cols-2">
            {summaries.map((item) => (
              <div key={item.label} className="card border border-gray-200 dark:border-gray-700 text-center p-8">
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{item.value}</p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{item.label}</p>
              </div>
            ))}
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

      <section className="section bg-white" aria-labelledby="featured-heading">
        <div className="container-custom">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-500">{t('home.featuredJobs')}</p>
              <h2 id="featured-heading" className="heading-2 mt-3">{t('home.topOpportunities')}</h2>
            </div>
            <Link to="/jobs" className="btn btn-outline">
              {t('home.viewAllJobs')}
            </Link>
          </div>

          <FeaturedJobs />
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-custom">
          <AnimatedSearch />
        </div>
      </section>

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

      <section className="section bg-slate-50" aria-label="Top companies">
        <div className="container-custom">
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

      <Statistics />
    </div>
  );
};

export default Home;
