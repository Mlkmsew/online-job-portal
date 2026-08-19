// ============================================
// About Us Page - OnlineJob Portal
// Professional About page for the Ethiopian platform
// ============================================
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiTarget, FiEye, FiUsers, FiBriefcase } from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import api from '../services/api';

const STAT_ITEMS = [
  { key: 'jobSeekers', label: 'Job Seekers', icon: FiUsers },
  { key: 'companies', label: 'Companies', icon: FaBuilding },
  { key: 'activeJobs', label: 'Active Jobs', icon: FiBriefcase },
];

const About = () => {
  const { t } = useTranslation();
  const [communityStats, setCommunityStats] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/stats/community')
      .then((res) => {
        if (active) setCommunityStats(res.data?.data || null);
      })
      .catch(() => {
        if (active) setCommunityStats(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const statValue = (key) => {
    const count = communityStats?.[key];
    return typeof count === 'number' ? `${count.toLocaleString('en-US')}+` : '—';
  };

  return (
    <div className="min-h-screen bg-[#F4F8F7] pb-16 lg:pb-24">
      <div className="container-custom pt-10 lg:pt-14">
        {/* ===== PAGE TITLE ===== */}
        <h1 className="text-2xl font-bold tracking-tight text-[#14213D] sm:text-3xl">
          {t('about.title', { defaultValue: 'About OnlineJob Portal' })}
        </h1>

        {/* ===== HERO CARD ===== */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="grid lg:grid-cols-2">
            {/* LEFT — About content */}
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1769E0]">
                {t('about.eyebrow', { defaultValue: 'About' })}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#14213D] sm:text-4xl">
                OnlineJob <span className="text-[#1769E0]">Portal</span>
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#334155]">
                {t('about.heroDescription', {
                  defaultValue:
                    'OnlineJob Portal is a modern employment marketplace built to empower job seekers and employers with smarter, faster hiring tools. Our platform brings together local talent, curated job opportunities, and career resources in one easy-to-use experience.',
                })}
              </p>
            </div>

            {/* RIGHT — Professional image */}
            <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAF2FE] via-[#E7F6EF] to-[#DFF0EB]">
              <img
                src="/images/hero-people.png"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
                alt={t('about.imageAlt', { defaultValue: 'Ethiopian professionals collaborating in a modern office' })}
                className="h-full w-full object-contain"
              />
              <span className="absolute left-1/2 top-6 h-16 w-16 -translate-x-1/2 rounded-full bg-white/40 blur-xl" aria-hidden="true" />
            </div>
          </div>

          {/* ===== STATISTICS ===== */}
          <div className="border-t border-slate-100">
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
              {STAT_ITEMS.map((stat) => (
                <div key={stat.label} className="flex items-center justify-center gap-4 px-6 py-7">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[#EAF2FE] text-[#1769E0]">
                    <stat.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-2xl font-extrabold text-[#14213D] sm:text-3xl">{statValue(stat.key)}</p>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== MISSION & VISION ===== */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* OUR MISSION */}
          <div className="relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-xl lg:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1769E0] text-white shadow-lg">
              <FiTarget className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-[#14213D]">{t('about.missionTitle', { defaultValue: 'Our Mission' })}</h2>
            <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-[#1769E0]" aria-hidden="true" />
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#334155]">
              {t('about.missionText', {
                defaultValue:
                  'To empower every professional with access to relevant jobs, clear career guidance, and a seamless application journey. We strive to create a trusted hiring ecosystem that helps talent grow and employers hire with confidence.',
              })}
            </p>
            <svg
              className="absolute -bottom-8 -left-10 h-40 w-64 text-[#EAF2FE]"
              viewBox="0 0 300 160"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M0 160 C 80 60, 200 40, 300 80 L 300 160 Z" />
            </svg>
          </div>

          {/* OUR VISION */}
          <div className="relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-xl lg:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF2FE] text-[#1769E0] shadow-lg">
              <FiEye className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-[#14213D]">{t('about.visionTitle', { defaultValue: 'Our Vision' })}</h2>
            <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-[#1769E0]" aria-hidden="true" />
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#334155]">
              {t('about.visionText', {
                defaultValue:
                  'A future where opportunity is easy to find and every candidate can connect with work they love. We want OnlineJob Portal to set the standard for transparent, inclusive, and efficient hiring nationwide.',
              })}
            </p>
            <svg
              className="absolute -bottom-8 -right-10 h-40 w-64 text-[#E7F6EF]"
              viewBox="0 0 300 160"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M300 160 C 220 60, 100 40, 0 80 L 0 160 Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;