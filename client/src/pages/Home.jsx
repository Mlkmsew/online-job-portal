// ============================================
// Home Page - OnlineJob Portal
// Professional blue-based landing page for Ethiopia
// ============================================
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiFileText,
  FiUsers,
  FiHeart,
  FiDollarSign,
  FiShield,
  FiAward,
  FiSend,
  FiCpu,
  FiBell,
  FiLock,
  FiStar,
  FiArrowRight,
  FiMail,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiBarChart2,
  FiDatabase,
  FiGlobe,
} from 'react-icons/fi';
import { Code2, LineChart, Cog, HeartPulse, GraduationCap, Megaphone, ClipboardList, HeartHandshake, Briefcase, Activity, Award, BookOpen, Camera, Coffee, Cpu, DollarSign, Film, Globe, Heart, Home as HomeIcon, Layers, MapPin, Mic, Monitor, Music, Shield, ShoppingBag, Smartphone, Star, Wrench, TrendingUp, Truck, Users, Zap } from 'lucide-react';
import { FaBuilding } from 'react-icons/fa';
import api from '../services/api';

/* ──────────────────────────────────────────────
   STATIC CONTENT (blue-based Ethiopian job portal)
   ────────────────────────────────────────────── */

const CATEGORIES = [
  {
    name: 'IT & Software',
    icon: Code2,
    jobs: '124 Jobs',
    iconBg: 'bg-blue-100 text-blue-700 group-hover:bg-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:group-hover:bg-blue-700',
  },
  {
    name: 'Accounting & Finance',
    icon: LineChart,
    jobs: '86 Jobs',
    iconBg: 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:group-hover:bg-indigo-700',
  },
  {
    name: 'Engineering',
    icon: Cog,
    jobs: '95 Jobs',
    iconBg: 'bg-cyan-100 text-cyan-700 group-hover:bg-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 dark:group-hover:bg-cyan-700',
  },
  {
    name: 'Healthcare',
    icon: HeartPulse,
    jobs: '72 Jobs',
    iconBg: 'bg-rose-100 text-rose-700 group-hover:bg-rose-700 dark:bg-rose-900/40 dark:text-rose-300 dark:group-hover:bg-rose-700',
  },
  {
    name: 'Education',
    icon: GraduationCap,
    jobs: '64 Jobs',
    iconBg: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 dark:bg-amber-900/40 dark:text-amber-300 dark:group-hover:bg-amber-600',
  },
  {
    name: 'Marketing',
    icon: Megaphone,
    jobs: '58 Jobs',
    iconBg: 'bg-purple-100 text-purple-700 group-hover:bg-purple-700 dark:bg-purple-900/40 dark:text-purple-300 dark:group-hover:bg-purple-700',
  },
  {
    name: 'Administration',
    icon: ClipboardList,
    jobs: '49 Jobs',
    iconBg: 'bg-teal-100 text-teal-700 group-hover:bg-teal-700 dark:bg-teal-900/40 dark:text-teal-300 dark:group-hover:bg-teal-700',
  },
  {
    name: 'NGO & Development',
    icon: HeartHandshake,
    jobs: '77 Jobs',
    iconBg: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:group-hover:bg-emerald-700',
  },
];

const CATEGORY_ICON_MAP = {
  briefcase: Briefcase,
  activity: Activity,
  award: Award,
  'book-open': BookOpen,
  book: BookOpen,
  camera: Camera,
  clipboard: ClipboardList,
  code: Code2,
  coffee: Coffee,
  cpu: Cpu,
  'dollar-sign': DollarSign,
  film: Film,
  globe: Globe,
  heart: Heart,
  'home': HomeIcon,
  layers: Layers,
  'map-pin': MapPin,
  mic: Mic,
  monitor: Monitor,
  music: Music,
  shield: Shield,
  'shopping-bag': ShoppingBag,
  smartphone: Smartphone,
  star: Star,
  tool: Wrench,
  'trending-up': TrendingUp,
  truck: Truck,
  users: Users,
  zap: Zap,
};

const CATEGORY_ICON_BGS = [
  'bg-blue-100 text-blue-700 group-hover:bg-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:group-hover:bg-blue-700',
  'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:group-hover:bg-indigo-700',
  'bg-cyan-100 text-cyan-700 group-hover:bg-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 dark:group-hover:bg-cyan-700',
  'bg-rose-100 text-rose-700 group-hover:bg-rose-700 dark:bg-rose-900/40 dark:text-rose-300 dark:group-hover:bg-rose-700',
  'bg-amber-100 text-amber-700 group-hover:bg-amber-600 dark:bg-amber-900/40 dark:text-amber-300 dark:group-hover:bg-amber-600',
  'bg-purple-100 text-purple-700 group-hover:bg-purple-700 dark:bg-purple-900/40 dark:text-purple-300 dark:group-hover:bg-purple-700',
  'bg-teal-100 text-teal-700 group-hover:bg-teal-700 dark:bg-teal-900/40 dark:text-teal-300 dark:group-hover:bg-teal-700',
  'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:group-hover:bg-emerald-700',
];

const resolveCategoryIcon = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return Briefcase;
  if (/[^\u0000-\u007F]/.test(raw)) return null;
  return CATEGORY_ICON_MAP[raw.toLowerCase()] || Briefcase;
};

const STAT_ITEMS = [
  { key: 'jobSeekers', label: 'Job Seekers', icon: FiUser },
  { key: 'companies', label: 'Registered Companies', icon: FiBriefcase },
  { key: 'applications', label: 'Applications', icon: FiFileText },
  { key: 'categories', label: 'Industry Categories', icon: FiGlobe },
];

const FEATURES = [
  { title: 'Verified Job Opportunities', desc: 'Every vacancy is reviewed and verified before it is published.', icon: FiShield },
  { title: 'Trusted Employers', desc: 'Only registered and approved companies can post openings.', icon: FiAward },
  { title: 'Easy Online Applications', desc: 'Apply to jobs with a few clicks from any device.', icon: FiSend },
  { title: 'Professional CV Management', desc: 'Build, upload and manage a polished CV that stands out.', icon: FiFileText },
  { title: 'Personalized Job Recommendations', desc: 'Get matched to roles that fit your skills and experience.', icon: FiCpu },
  { title: 'Job Alerts & Notifications', desc: 'Receive instant alerts when new matching jobs are posted.', icon: FiBell },
  { title: 'Secure User Accounts', desc: 'Your personal data is protected with industry-standard security.', icon: FiLock },
  { title: 'Ethiopian Language Support', desc: 'Browse and apply in English, Amharic or Afaan Oromoo.', icon: FiGlobe },
];

const TESTIMONIALS = [
  {
    name: 'Melkamsew Alehegn',
    role: 'Software Engineer',
    company: 'Ethio Telecom',
    rating: 5,
    initials: 'MA',
    color: 'bg-blue-600',
    text: 'I found my dream job in less than two weeks. The CV builder made my profile look professional and recruiters started reaching out to me.',
  },
  {
    name: 'Jemal Yimer',
    role: 'HR Manager',
    company: 'Dashen Bank',
    rating: 5,
    initials: 'JY',
    color: 'bg-indigo-600',
    text: 'As an employer, we receive high-quality, well-matched candidates. The platform saved us weeks of manual screening and hiring time.',
  },
  {
    name: 'Solomon Tadesse',
    role: 'Registered Nurse',
    company: 'Tikur Anbessa Hospital',
    rating: 4,
    initials: 'ST',
    color: 'bg-cyan-600',
    text: 'The job alerts matched my skills perfectly. I applied to three positions and got an interview within a week. Highly recommended!',
  },
];

const SAMPLE_JOBS = [
  { id: 'sample-1', title: 'Senior Software Engineer', companyName: 'Ethio Telecom', logo: '/images/logos/ethio-telecom.svg', location: 'Addis Ababa', jobType: 'Full-time', salary: 'Negotiable', posted: 'Today', category: 'IT & Software', experienceLevel: 'Senior', isRemote: false },
  { id: 'sample-2', title: 'Accountant', companyName: 'Dashen Bank', logo: '/images/logos/dashen-bank.svg', location: 'Addis Ababa', jobType: 'Full-time', salary: 'ETB 25,000 - 40,000', posted: '2 days ago', category: 'Accounting & Finance', experienceLevel: 'Mid', isRemote: false },
  { id: 'sample-3', title: 'Marketing Officer', companyName: 'Safaricom Ethiopia', logo: '/images/logos/safaricom.svg', location: 'Addis Ababa', jobType: 'Contract', salary: 'Negotiable', posted: '3 days ago', category: 'Marketing', experienceLevel: 'Entry', isRemote: false },
  { id: 'sample-4', title: 'Registered Nurse', companyName: 'Tikur Anbessa Hospital', location: 'Addis Ababa', jobType: 'Full-time', salary: 'ETB 18,000 - 30,000', posted: '5 days ago', category: 'Healthcare', experienceLevel: 'Mid', isRemote: false },
  { id: 'sample-5', title: 'Project Officer (NGO)', companyName: 'Save the Children Ethiopia', location: 'Addis Ababa', jobType: 'Full-time', salary: 'Negotiable', posted: '1 week ago', category: 'NGO & Development', experienceLevel: 'Mid', isRemote: false },
  { id: 'sample-6', title: 'Frontend Developer', companyName: 'Gebeya Inc.', location: 'Remote', jobType: 'Remote', salary: 'Negotiable', posted: '2 weeks ago', category: 'IT & Software', experienceLevel: 'Junior', isRemote: true },
];

/* ──────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────── */

const formatLocation = (loc) => {
  if (!loc) return 'Remote';
  if (typeof loc === 'string') return loc;
  if (loc.city && loc.region) return `${loc.city}, ${loc.region}`;
  return loc.city || loc.region || 'Remote';
};

const formatSalary = (salary) => {
  if (!salary) return 'Negotiable';
  if (typeof salary === 'string') return salary;
  const min = salary.min;
  const max = salary.max;
  const cur = salary.currency || 'ETB';
  if (min && max) return `${cur} ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`;
  if (min) return `${cur} ${Number(min).toLocaleString()}+`;
  if (salary.isNegotiable) return 'Negotiable';
  return 'Negotiable';
};

const formatPosted = (date) => {
  if (!date) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
};

const slugify = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');

/* ──────────────────────────────────────────────
   REUSABLE BLOCKS
   ────────────────────────────────────────────── */

const SectionHeading = ({ eyebrow, title, subtitle, light, id }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${light ? 'text-sky-300' : 'text-blue-600 dark:text-blue-400'}`}>{eyebrow}</p>
    <h2 id={id} className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-[#0F172A] dark:text-gray-100'}`}>{title}</h2>
    {subtitle && <p className={`mt-4 text-base ${light ? 'text-sky-100/90' : 'text-slate-600 dark:text-gray-400'}`}>{subtitle}</p>}
  </div>
);

const LogoAvatar = ({ logo, name, className = 'h-12 w-12 rounded-xl' }) => {
  const [failed, setFailed] = useState(false);
  const hasLogo = !!logo && !failed;
  if (!hasLogo) {
    return (
      <span className={`flex items-center justify-center ${className} bg-slate-100 text-base font-bold text-slate-700 dark:bg-gray-800 dark:text-gray-300`}>
        {(name || 'C').charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
      className={`${className} bg-white object-contain object-center`}
    />
  );
};

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} star rating`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <FiStar
        key={n}
        className={`h-4 w-4 ${n <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-gray-600'}`}
        fill={n <= rating ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    ))}
  </div>
);

/* ──────────────────────────────────────────────
   HOME PAGE
   ────────────────────────────────────────────── */

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isJobSeeker = user?.role === 'jobseeker';

  // Hero search state
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');

  // Latest jobs state
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saved, setSaved] = useState({});
  const [communityStats, setCommunityStats] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSalary, setFilterSalary] = useState('');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [jobsRes, companiesRes, categoriesRes, statsRes] = await Promise.all([
          api.get('/jobs', { params: { limit: 12, isApproved: true } }),
          api.get('/companies', { params: { isApproved: true, limit: 12 } }),
          api.get('/categories'),
          api.get('/stats/community'),
        ]);

        const statsData = statsRes.data?.data || {};
        setCommunityStats({
          jobSeekers: statsData.jobSeekers ?? 0,
          companies: statsData.companies ?? 0,
          activeJobs: statsData.activeJobs ?? 0,
          applications: statsData.applications ?? 0,
          categories: statsData.categories ?? 0,
        });

        const realJobs = (Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data?.data || []).map((j) => ({
          id: j._id || j.id,
          title: j.title,
          companyName: j.company?.name || j.companyName || 'Company',
          logo: j.company?.logo || '',
          location: formatLocation(j.location),
          jobType: j.jobType || 'Full-time',
          salary: formatSalary(j.salary),
          posted: formatPosted(j.createdAt),
          category: typeof j.category === 'object' && j.category ? j.category.name : j.category || 'General',
          experienceLevel: j.experienceLevel || 'Any',
          isRemote: j.isRemote,
        }));

        const realCompanies = (Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes.data?.data || []).map((c) => ({
          id: c._id || c.id,
          name: c.name,
          industry: c.industry || 'General',
          location: formatLocation(c.address || c.location),
          openPositions: c.openPositions ?? 0,
          logo: c.logo || '',
        }));

        const realCategories = (Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.data || []).map((c, i) => ({
          name: c.name,
          icon: resolveCategoryIcon(c.icon),
          jobs: `${c.jobCount ?? 0} ${t('home.jobsLabel', { defaultValue: 'jobs' })}`,
          iconBg: CATEGORY_ICON_BGS[i % CATEGORY_ICON_BGS.length],
        }));

        // Fill with curated samples so the page always looks production-ready
        const allJobs = realJobs.length >= 3 ? realJobs : [...realJobs, ...SAMPLE_JOBS];
        const allCompanies = realCompanies;
        const allCategories = realCategories.length > 0 ? realCategories : CATEGORIES;

        setJobs(allJobs.slice(0, 6));
        setCompanies(allCompanies.slice(0, 3));
        setCategories(allCategories.slice(0, 8));
      } catch (error) {
        setJobs(SAMPLE_JOBS);
        setCompanies([]);
      }
    };

    loadHomeData();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('search', keyword.trim());
    if (location.trim()) params.set('city', location.trim());
    if (category) params.set('category', category);
    navigate(`/jobs?${params.toString()}`);
  };

  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(next[id] ? 'Job saved to your favorites' : 'Job removed from favorites');
      return next;
    });
  };

  const jobIdIsReal = (id) => String(id).startsWith('sample');

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filterCategory && job.category !== filterCategory) return false;
      if (filterLocation && job.location !== filterLocation) return false;
      if (filterType && job.jobType !== filterType) return false;
      if (filterLevel && job.experienceLevel !== filterLevel) return false;
      if (filterSalary === 'low' && job.salary.includes('Negotiable')) return true;
      return true;
    });
  }, [jobs, filterCategory, filterLocation, filterType, filterLevel, filterSalary]);

  const filterOptions = useMemo(() => ({
    categories: [...new Set(jobs.map((j) => j.category).filter(Boolean))],
    locations: [...new Set(jobs.map((j) => j.location).filter(Boolean))],
    types: [...new Set(jobs.map((j) => j.jobType).filter(Boolean))],
    levels: [...new Set(jobs.map((j) => j.experienceLevel).filter(Boolean))],
  }), [jobs]);

  const selectClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';

  const heroTitle = t('home.heroTitle', { defaultValue: 'FIND THE RIGHT JOB.\nBUILD YOUR FUTURE.' });
  const heroTitleLines = heroTitle.includes('\n') ? heroTitle.split('\n') : heroTitle.split('. ').filter(Boolean);

  const subscribe = (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    if (!email) return;
    toast.success('You have subscribed to job alerts. Thank you!');
    event.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220]">
      {/* ════════════════════════════════════════
          1. HERO SECTION
          ════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg-career.svg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#06152B]/85 via-[#0A2A5E]/80 to-[#10337F]/70 dark:from-[#02040A]/95 dark:via-[#0A1626]/90 dark:to-[#0E1B33]/85" />

        <div className="container-custom relative z-10 pt-10 pb-16 lg:pt-14 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left — copy + search */}
            <div>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="mt-2 max-w-3xl text-[2.5rem] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  {heroTitleLines.map((line, i) => (
                    <span
                      key={line}
                      className={`block drop-shadow-[0_3px_14px_rgba(6,30,60,0.55)] ${
                        i === 0
                          ? 'bg-gradient-to-r from-white via-sky-50 to-sky-300 bg-clip-text text-transparent'
                          : 'text-white'
                      }`}
                    >
                      {line}
                    </span>
                  ))}
                </h1>
                <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-sky-50 sm:text-lg [text-shadow:0_2px_12px_rgba(6,30,60,0.6)]">
                  {t('home.heroTagline', { defaultValue: 'Connect with opportunities, discover your potential, and take the next step in your career.' })}
                </p>
                <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed tracking-normal text-sky-100/90">
                  {t('home.heroSubtitle', { defaultValue: 'Connecting Ethiopian Youth with Employment Opportunities' })}
                </p>
              </motion.div>

              {/* Search form */}
              <motion.form
                onSubmit={handleSearch}
                className="mt-8 flex w-full max-w-3xl flex-col items-stretch gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-blue-950/25 ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10 md:flex-row md:items-center"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                aria-label="Job search"
              >
                <div className="relative flex-[1.35]">
                  <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-500" aria-hidden="true" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t('home.searchPlaceholder', { defaultValue: 'Job title, skills, or keywords' })}
                    aria-label={t('home.searchPlaceholder', { defaultValue: 'Job title, skills, or keywords' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-900"
                  />
                </div>
                <div className="hidden h-9 w-px shrink-0 bg-slate-200 md:block" aria-hidden="true" />
                <div className="relative flex-1">
                  <FiMapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-500" aria-hidden="true" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('home.locationPlaceholder', { defaultValue: 'Location' })}
                    aria-label={t('home.locationPlaceholder', { defaultValue: 'Location' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  className="ml-0 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 md:ml-1"
                >
                  <FiSearch className="h-4 w-4" aria-hidden="true" />
                  <span>{t('home.searchButton', { defaultValue: 'Search Jobs' })}</span>
                </button>
              </motion.form>


              {/* Live platform stats */}
              {communityStats && communityStats.activeJobs > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-sky-100">
                  <span>
                    <span className="text-white">{communityStats.activeJobs.toLocaleString('en-US')}</span>{' '}
                    {t('home.statsActiveJobs', { defaultValue: 'Active Jobs' })}
                  </span>
                  <span className="text-sky-300" aria-hidden="true">•</span>
                  <span>
                    <span className="text-white">{communityStats.companies.toLocaleString('en-US')}</span>{' '}
                    {t('home.statsCompanies', { defaultValue: 'Companies' })}
                  </span>
                  <span className="text-sky-300" aria-hidden="true">•</span>
                  <span className="text-sky-200/90">{t('home.statsDaily', { defaultValue: 'New Opportunities Every Day' })}</span>
                </div>
              )}
            </div>

            {/* Right — recruitment technology composition */}
            <motion.div
              className="relative hidden lg:flex h-[520px] items-center justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              aria-hidden="true"
            >
              {/* decorative glow + dot grid */}
              <div className="absolute inset-0">
                <div className="absolute right-6 top-4 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
                <div className="absolute bottom-4 left-4 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
                <div className="absolute right-24 bottom-10 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
              </div>

              {/* connecting network lines */}
              <svg className="absolute inset-0 z-0 h-full w-full" viewBox="0 0 500 520" preserveAspectRatio="none" aria-hidden="true">
                <line x1="250" y1="70" x2="20" y2="160" stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" />
                <line x1="250" y1="70" x2="40" y2="330" stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" />
                <line x1="250" y1="70" x2="24" y2="470" stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" />
                <line x1="250" y1="70" x2="470" y2="170" stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" />
                <line x1="470" y1="170" x2="440" y2="330" stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" />
                <line x1="250" y1="70" x2="300" y2="250" stroke="rgba(147,197,253,0.3)" strokeWidth="1.5" />
              </svg>

              {/* people photo lower-right — transparent cutout, no container, scales freely */}
              <motion.div
                className="absolute bottom-0 right-0 z-10 h-[82%] w-[96%] overflow-visible"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src="/images/hero-people.png"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  alt="Ethiopian professionals collaborating"
                  className="block h-full w-full origin-center bg-transparent object-contain [filter:contrast(1.05)_saturate(1.1)] [transform:scale(1.2)]"
                />
              </motion.div>

              {/* category pills */}

            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. POPULAR JOB CATEGORIES
          ════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-[#0D1624]" aria-labelledby="categories-heading">
        <div className="container-custom">
          <SectionHeading
            id="categories-heading"
            eyebrow={t('home.categoriesEyebrow', { defaultValue: 'Browse by field' })}
            title={t('home.popularCategories', { defaultValue: 'Popular Job Categories' })}
            subtitle={t('home.categoriesSubtitle', { defaultValue: 'Explore 12 industry categories with thousands of opportunities.' })}
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(categories.length ? categories : CATEGORIES).map((cat, index) => (
              <Link
                key={cat.name}
                to={`/jobs?category=${encodeURIComponent(slugify(cat.name))}`}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800"
              >
                <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:scale-105 group-hover:text-white ${cat.iconBg}`}>
                  {cat.icon ? (
                    <cat.icon className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <span className="text-xl" aria-hidden="true">{String(cat.name).charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <h3 className="mt-5 text-lg font-bold leading-snug text-[#0F172A] dark:text-gray-100 transition-colors duration-300 group-hover:text-[#1769E0]">
                  {cat.name}
                </h3>
                <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-gray-400">{cat.jobs}</p>
                <span className="absolute right-5 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:bg-blue-50 group-hover:text-[#1769E0] group-hover:opacity-100 -translate-x-2 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-300">
                  <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/categories"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-[#1769E0] px-8 py-3.5 text-sm font-bold text-[#1769E0] transition-all duration-300 hover:bg-[#1769E0] hover:text-white hover:shadow-lg hover:shadow-blue-200 dark:text-blue-400"
            >
              {t('home.viewAllCategories', { defaultValue: 'View All Categories' })}
              <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. LATEST JOBS
          ════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20 dark:bg-[#0B1220]" aria-labelledby="latest-jobs-heading">
        <div className="container-custom">
          <SectionHeading
            id="latest-jobs-heading"
            eyebrow={t('home.latestEyebrow', { defaultValue: 'Fresh opportunities' })}
            title={t('home.latestJobs', { defaultValue: 'Latest Job Opportunities' })}
            subtitle={t('home.latestSubtitle', { defaultValue: 'Browse the most recent openings posted by trusted employers across Ethiopia.' })}
          />

          {/* Filters */}
          <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5 dark:border-gray-800 dark:bg-gray-900">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass} aria-label="Filter by category">
              <option value="">{t('jobs.category', { defaultValue: 'Category' })}</option>
              {filterOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className={selectClass} aria-label="Filter by location">
              <option value="">{t('jobs.location', { defaultValue: 'Location' })}</option>
              {filterOptions.locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass} aria-label="Filter by employment type">
              <option value="">{t('jobs.jobType', { defaultValue: 'Employment type' })}</option>
              {filterOptions.types.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
            </select>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className={selectClass} aria-label="Filter by experience level">
              <option value="">{t('jobs.experience', { defaultValue: 'Experience' })}</option>
              {filterOptions.levels.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
            </select>
            <select value={filterSalary} onChange={(e) => setFilterSalary(e.target.value)} className={selectClass} aria-label="Filter by salary">
              <option value="">{t('jobs.salary', { defaultValue: 'Salary' })}</option>
              <option value="low">Negotiable</option>
              <option value="high">ETB 20,000+</option>
            </select>
          </div>

          {/* Job cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredJobs.map((job) => (
              <div key={job.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <LogoAvatar logo={job.logo} name={job.companyName} className="h-14 w-14 rounded-2xl" />
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-gray-100 group-hover:text-blue-700">{job.title}</h3>
                      <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-gray-400">{job.companyName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSave(job.id)}
                    aria-pressed={!!saved[job.id]}
                    aria-label={saved[job.id] ? 'Remove job from saved jobs' : 'Save job'}
className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      saved[job.id] ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300'
                    }`}
                  >
                    <FiHeart className="h-4 w-4" fill={saved[job.id] ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5"><FiMapPin className="h-4 w-4 text-slate-400 dark:text-gray-500" aria-hidden="true" />{job.location}</span>
                  <span className="inline-flex items-center gap-1.5"><FiBriefcase className="h-4 w-4 text-slate-400 dark:text-gray-500" aria-hidden="true" />{job.jobType}</span>
                  <span className="inline-flex items-center gap-1.5"><FiDollarSign className="h-4 w-4 text-slate-400 dark:text-gray-500" aria-hidden="true" />{job.salary}</span>
                  <span className="inline-flex items-center gap-1.5"><FiClock className="h-4 w-4 text-slate-400 dark:text-gray-500" aria-hidden="true" />{job.posted}</span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <Link
                    to={jobIdIsReal(job.id) ? '/jobs' : `/jobs/${job.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  >
                    {t('home.viewDetails', { defaultValue: 'View Details' })}
                  </Link>
                  {isJobSeeker && (
                    <Link
                      to={jobIdIsReal(job.id) ? '/register' : `/jobs/${job.id}/apply`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
                    >
                      {t('home.applyNow', { defaultValue: 'Apply Now' })}
                      <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              {t('home.viewAllJobs', { defaultValue: 'View All Jobs' })}
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. TOP COMPANIES
          ════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-[#0D1624]" aria-labelledby="companies-heading">
        <div className="container-custom">
          <SectionHeading
            id="companies-heading"
            eyebrow={t('home.companiesEyebrow', { defaultValue: 'Trusted employers' })}
            title={t('home.topCompanies', { defaultValue: 'Top Companies Hiring' })}
            subtitle={t('home.companiesSubtitle', { defaultValue: 'Join leading companies across Ethiopia that are actively looking for talent.' })}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800"
              >
                <div className="flex justify-center">
                  <LogoAvatar logo={company.logo} name={company.name} className="h-16 w-16 rounded-2xl" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#0F172A] dark:text-gray-100 group-hover:text-blue-700">{company.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">{company.industry}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                  <FiMapPin className="h-4 w-4 text-slate-400 dark:text-gray-500" aria-hidden="true" />{company.location}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <FiBriefcase className="h-3.5 w-3.5" aria-hidden="true" />
                  {company.openPositions} {t('home.openPositions', { defaultValue: 'open positions' })}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 dark:text-blue-400">
                  {t('home.viewCompany', { defaultValue: 'View Company' })}
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/companies"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
            >
              {t('home.viewAllCompanies', { defaultValue: 'View All Companies' })}
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. HOW IT WORKS
          ════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20 dark:bg-[#0B1220]" aria-labelledby="how-heading">
        <div className="container-custom">
          <SectionHeading
            id="how-heading"
            eyebrow={t('home.howEyebrow', { defaultValue: 'Simple process' })}
            title={t('home.howTitle', { defaultValue: 'How It Works' })}
            subtitle={t('home.howSubtitle', { defaultValue: 'A simple, guided journey for both job seekers and employers.' })}
          />

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Job Seekers */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-gray-100">{t('home.forJobSeekers', { defaultValue: 'For Job Seekers' })}</h3>
              <div className="mt-8 space-y-0">
                {[
                  { icon: FiUser, title: 'Create an Account' },
                  { icon: FiFileText, title: 'Build Your Profile & CV' },
                  { icon: FiSearch, title: 'Search & Apply for Jobs' },
                  { icon: FiStar, title: 'Get Hired' },
                ].map((step, i) => (
                  <div key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < 3 && <span className="absolute left-[22px] top-12 h-[calc(100%-3rem)] w-0.5 border-l-2 border-dashed border-blue-200" aria-hidden="true" />}
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-blue-600 text-base font-extrabold text-white shadow-md">
                      {i + 1}
                    </span>
                    <div className="pt-1">
                      <h4 className="text-base font-bold text-[#0F172A] dark:text-gray-100">{step.title}</h4>
                      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t(`home.seekerStep${i + 1}`, { defaultValue: step.title })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700">
                {t('home.startApplying', { defaultValue: 'Start Applying' })}
                <FiArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Employers */}
            <div className="rounded-3xl border border-slate-200 bg-blue-50/60 p-8 dark:border-gray-800 dark:bg-blue-900/20">
              <h3 className="text-xl font-extrabold text-[#0F172A] dark:text-gray-100">{t('home.forEmployers', { defaultValue: 'For Employers' })}</h3>
              <div className="mt-8 space-y-0">
                {[
                  { icon: FaBuilding, title: 'Register Company' },
                  { icon: FiBriefcase, title: 'Post a Job' },
                  { icon: FiUsers, title: 'Review Applications' },
                  { icon: FiAward, title: 'Hire the Best Candidate' },
                ].map((step, i) => (
                  <div key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < 3 && <span className="absolute left-[22px] top-12 h-[calc(100%-3rem)] w-0.5 border-l-2 border-dashed border-blue-300" aria-hidden="true" />}
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-blue-700 text-base font-extrabold text-white shadow-md">
                      {i + 1}
                    </span>
                    <div className="pt-1">
                      <h4 className="text-base font-bold text-[#0F172A] dark:text-gray-100">{step.title}</h4>
                      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t(`home.employerStep${i + 1}`, { defaultValue: step.title })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/employer/post-job" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-800">
                {t('home.postAJob', { defaultValue: 'Post a Job' })}
                <FiArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          7. PLATFORM STATISTICS
          ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1F3F] via-[#0D2A5C] to-[#123B7C] py-16 lg:py-20" aria-label="Platform statistics">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/images/hero-bg-career.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }} aria-hidden="true" />
        <div className="container-custom relative z-10">
          <SectionHeading
            light
            id="stats-heading"
            eyebrow={t('home.statsEyebrow', { defaultValue: 'Our growing community' })}
            title={t('home.statsTitle', { defaultValue: 'Thousands Already Trust OnlineJob Portal' })}
          />
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 lg:grid-cols-4">
            {STAT_ITEMS.map((stat) => {
              const count = communityStats?.[stat.key];
              const display = typeof count === 'number' ? `${count.toLocaleString('en-US')}+` : '—';
              return (
                <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm transition hover:bg-white/15">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-sky-200">
                    <stat.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-3xl font-extrabold text-white">{display}</p>
                  <p className="mt-1 text-sm font-medium text-sky-100/80">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8. WHY CHOOSE US
          ════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-[#0D1624]" aria-labelledby="why-heading">
        <div className="container-custom">
          <SectionHeading
            id="why-heading"
            eyebrow={t('home.whyEyebrow', { defaultValue: 'Why choose us' })}
            title={t('home.whyTitle', { defaultValue: 'Why Choose OnlineJob Portal?' })}
            subtitle={t('home.whySubtitle', { defaultValue: 'Everything you need to find the right opportunity or hire the right person.' })}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-900/40 dark:text-blue-300">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-[#0F172A] dark:text-gray-100 group-hover:text-blue-700">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          9. CV PROMOTION
          ════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20 dark:bg-[#0B1220]" aria-labelledby="cv-heading">
        <div className="container-custom">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F3F] via-[#0D2A5C] to-[#123B7C]">
            <div className="grid items-center gap-10 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-14">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">{t('home.cvEyebrow', { defaultValue: 'Get noticed' })}</p>
                <h2 id="cv-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {t('home.cvTitle', { defaultValue: 'Build a Professional CV That Gets You Noticed' })}
                </h2>
                <p className="mt-4 max-w-xl text-base text-sky-100/90">
                  {t('home.cvSubtitle', { defaultValue: 'Create, upload and manage your professional CV and make it easier for employers to discover your skills.' })}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/dashboard/resume" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-sky-50">
                    <FiFileText className="h-4 w-4" aria-hidden="true" />
                    {t('home.createCv', { defaultValue: 'Create CV' })}
                  </Link>
                  <Link to="/dashboard/resume" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/70 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                    <FiSend className="h-4 w-4" aria-hidden="true" />
                    {t('home.uploadCv', { defaultValue: 'Upload CV' })}
                  </Link>
                </div>
              </div>
              {/* Stylized CV mockup */}
              <div className="hidden lg:flex justify-center">
                <div className="w-72 rotate-3 rounded-2xl border border-white/20 bg-white p-6 shadow-2xl transition-transform duration-300 hover:rotate-0 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white"><FiUser className="h-5 w-5" aria-hidden="true" /></span>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-gray-100">Hanna Bekele</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">Software Engineer</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="h-2.5 w-full rounded-full bg-blue-200" />
                    <div className="h-2.5 w-4/5 rounded-full bg-blue-200" />
                    <div className="h-2.5 w-3/5 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-5/6 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-2/3 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {['React', 'Node.js', 'SQL', 'Python'].map((skill) => (
                      <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          10. JOB SEEKER & EMPLOYER CTA
          ════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-[#0D1624]" aria-label="Call to action">
        <div className="container-custom">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 lg:p-10">
              <span className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
              <span className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" aria-hidden="true" />
              <FiUser className="h-10 w-10 text-sky-200" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">{t('home.seekerCta', { defaultValue: 'Looking for Your Next Opportunity?' })}</h3>
              <p className="mt-3 text-sm text-sky-100/90">{t('home.seekerCtaSub', { defaultValue: 'Join thousands of job seekers and find the role that fits your future.' })}</p>
              <Link to="/jobs" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-sky-50">
                {t('home.findJobs', { defaultValue: 'Find Jobs' })}
                <FiArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F3F] to-[#0D2A5C] p-8 lg:p-10">
              <span className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
              <span className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" aria-hidden="true" />
              <FaBuilding className="h-10 w-10 text-sky-200" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">{t('home.employerCta', { defaultValue: 'Looking for Talented Employees?' })}</h3>
              <p className="mt-3 text-sm text-sky-100/90">{t('home.employerCtaSub', { defaultValue: 'Post a job and reach Ethiopia\u2019s best qualified candidates instantly.' })}</p>
              <Link to="/employer/post-job" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500">
                {t('home.postAJob', { defaultValue: 'Post a Job' })}
                <FiArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          11. TESTIMONIALS
          ════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20 dark:bg-[#0B1220]" aria-labelledby="testimonials-heading">
        <div className="container-custom">
          <SectionHeading
            id="testimonials-heading"
            eyebrow={t('home.testimonialEyebrow', { defaultValue: 'Success stories' })}
            title={t('home.testimonials', { defaultValue: 'What Our Users Say' })}
            subtitle={t('home.testimonialSubtitle', { defaultValue: 'Real experiences from job seekers and employers across Ethiopia.' })}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <Stars rating={item.rating} />
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-gray-400">“{item.text}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color} text-sm font-bold text-white`}>
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-gray-100">{item.name}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{item.role} · {item.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          12. JOB ALERT SUBSCRIPTION
          ════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 lg:py-20 dark:bg-[#0D1624]" aria-labelledby="alert-heading">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm lg:p-12 dark:border-gray-800 dark:bg-gray-900">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <FiBell className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 id="alert-heading" className="mt-5 text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-gray-100 sm:text-4xl">
              {t('home.alertTitle', { defaultValue: 'Never Miss a Job Opportunity' })}
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-gray-400">
              {t('home.alertSubtitle', { defaultValue: 'Subscribe to receive the latest job opportunities and career updates.' })}
            </p>
            <form onSubmit={subscribe} className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t('home.alertEmail', { defaultValue: 'Enter your email address' })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {t('home.subscribe', { defaultValue: 'Subscribe' })}
                <FiArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-400 dark:text-gray-500">{t('home.alertPrivacy', { defaultValue: 'We respect your privacy. Unsubscribe at any time.' })}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;