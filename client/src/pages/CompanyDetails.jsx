import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiMapPin, FiGlobe, FiMail, FiPhone, FiBriefcase,
  FiUsers, FiCalendar, FiCheckCircle, FiStar,
  FiLinkedin, FiFacebook, FiInstagram, FiSend,
  FiAward, FiTag, FiExternalLink, FiClock,
} from 'react-icons/fi';
import api from '../services/api';

// ── brand palette (professional blue) ──────────────────────────────────────────
const PRIMARY = '#2563eb';
const PRIMARY_DARK = '#1d4ed8';
const PRIMARY_DARKER = '#1e40af';
const PRIMARY_LIGHT = '#eff6ff';
const PRIMARY_LIGHTER = '#dbeafe';
const PRIMARY_BORDER = '#bfdbfe';

// ── helpers ───────────────────────────────────────────────────────────────────
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const jobTypeColor = (type) => {
  const map = {
    'full-time': '#10b981',
    'part-time': '#3b82f6',
    contract: '#f59e0b',
    remote: '#8b5cf6',
    internship: '#ec4899',
  };
  return map[(type || '').toLowerCase()] || '#6b7280';
};

// ── dark mode hook ─────────────────────────────────────────────────────────────
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// ── shared style fragments ──────────────────────────────────────────────────────
const cardBase = (isDark) => ({
  background: isDark ? '#0f172a' : '#ffffff',
  borderRadius: 16,
  padding: 24,
  border: `1px solid ${isDark ? '#1e293b' : '#e8edf5'}`,
  boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
});

const sectionTitle = (isDark) => ({
  fontSize: 17, fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', marginBottom: 16,
  display: 'flex', alignItems: 'center', gap: 8,
});

const primaryButton = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
  background: PRIMARY, color: '#fff',
  textDecoration: 'none', border: 'none', cursor: 'pointer',
  transition: 'background 0.15s ease',
};

// ── sub-components ─────────────────────────────────────────────────────────────

// Compact information-list row used for Company Info
const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="cd-info-row" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: PRIMARY_LIGHT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={PRIMARY} />
      </div>
      <p style={{ flex: '0 0 130px', fontSize: 13, color: '#64748b', margin: 0, fontWeight: 600, letterSpacing: '0.02em' }}>{label}</p>
      <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 600, textAlign: 'left', wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
};

const SocialLink = ({ href, icon: Icon, label, color }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" title={label} className="cd-social"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 42, height: 42, borderRadius: 10,
        background: PRIMARY_LIGHT, color,
        border: `1px solid ${PRIMARY_BORDER}`,
        textDecoration: 'none',
      }}
    >
      <Icon size={18} />
    </a>
  ) : null;

// ── main page ───────────────────────────────────────────────────────────────────
const CompanyDetails = () => {
  const { t } = useTranslation();
  const isDark = useDarkMode();
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/companies/${id}`);
        setCompany(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `4px solid ${PRIMARY_BORDER}`, borderTopColor: PRIMARY,
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: isDark ? '#94A3B8' : '#64748b', fontSize: '14px' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <FiBriefcase size={48} color={isDark ? '#475569' : '#cbd5e1'} />
        <p style={{ color: isDark ? '#94A3B8' : '#64748b', fontSize: '16px' }}>Company not found.</p>
        <Link to="/companies" style={{ color: PRIMARY, fontWeight: 600, textDecoration: 'none' }}>← Back to Companies</Link>
      </div>
    );
  }

  const hasLogo = !!company.logo && !logoFailed;
  const initial = (company.name || 'C').charAt(0).toUpperCase();
  const openJobs = Array.isArray(company.jobs) ? company.jobs : [];
  const location = [company.location?.city, company.location?.region].filter(Boolean).join(', ');
  const hasSocials = company.socialLinks && Object.values(company.socialLinks).some(Boolean);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: `Open Positions (${openJobs.length})` },
    ...(company.benefits?.length ? [{ id: 'benefits', label: 'Benefits' }] : []),
  ];

  return (
    <div style={{ background: isDark ? '#0b1220' : '#f4f7fb', minHeight: '100vh', fontFamily: "'Inter','Outfit',sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cd-overview-grid { display:grid; grid-template-columns:minmax(0,1fr) 500px; gap:28px; align-items:stretch; }
        @media (max-width: 920px) { .cd-overview-grid { grid-template-columns:1fr; } }
        .cd-tabs { display:flex; gap:4px; overflow-x:auto; }
        .cd-tab { background:transparent; border:none; cursor:pointer; padding:14px 20px; font-size:14px; font-weight:600; color:#64748b; border-bottom:2px solid transparent; transition:color 0.15s ease, border-color 0.15s ease; white-space:nowrap; }
        .cd-tab.active { color:${PRIMARY}; border-bottom-color:${PRIMARY}; }
        .cd-tab:hover { color:${PRIMARY}; }
        .cd-tab:focus-visible { outline:2px solid ${PRIMARY}; outline-offset:-2px; border-radius:4px; }
        .cd-info-row { border-bottom:1px solid #eef2f7; }
        .cd-info-row:last-child { border-bottom:none; }
        .dark .cd-info-row { border-bottom:1px solid #1e293b; }
        .cd-social { transition:background 0.15s ease, border-color 0.15s ease; }
        .cd-social:hover { background:${PRIMARY_LIGHTER}; border-color:${PRIMARY_BORDER}; }
        .job-card { transition:border-color 0.15s ease, box-shadow 0.15s ease; }
        .job-card:hover { border-color:${PRIMARY_BORDER}; box-shadow:0 4px 14px rgba(37,99,235,0.10); }
        .job-card:focus-visible { outline:2px solid ${PRIMARY}; outline-offset:2px; }
        a:focus-visible, button:focus-visible { outline:2px solid ${PRIMARY}; outline-offset:2px; border-radius:6px; }
      `}</style>

      {/* ── HERO / COVER ───────────────────────────────────────────── */}
      <div style={{
        background: company.coverImage
          ? `linear-gradient(rgba(15,23,42,0.45),rgba(15,23,42,0.6)), url(${company.coverImage}) center/cover no-repeat`
          : (isDark ? '#1e3a8a' : PRIMARY_DARK),
        minHeight: 200,
        position: 'relative',
      }} />

      {/* ── PROFILE STRIP ───────────────────────────────────────────── */}
      <div style={{
        background: isDark ? '#0f172a' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#1e293b' : '#e8edf5'}`,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>

          {/* Logo */}
          <div style={{
            width: 104, height: 104, borderRadius: 20,
            border: isDark ? '4px solid #0f172a' : '4px solid #fff',
            background: hasLogo ? (isDark ? '#0f172a' : '#fff') : PRIMARY,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,99,235,0.20)',
            overflow: 'hidden', flexShrink: 0,
            marginTop: -52,
          }}>
            {hasLogo ? (
              <img src={company.logo} alt={company.name} onError={() => setLogoFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 42, fontWeight: 800, color: '#fff' }}>{initial}</span>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 220, paddingBottom: 16, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: isDark ? '#F4F8F6' : '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>{company.name}</h1>
              {company.isVerified && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                  background: isDark ? 'rgba(37,99,235,0.15)' : PRIMARY_LIGHT, color: PRIMARY_DARK, borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${PRIMARY_BORDER}`,
                }}>
                  <FiCheckCircle size={12} /> Verified
                </span>
              )}
              {company.isFeatured && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                  background: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', color: '#d97706', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: '1px solid #fde68a',
                }}>
                  <FiStar size={12} /> Featured
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
              {company.industry && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: isDark ? '#94A3B8' : '#64748b', fontSize: 13 }}>
                  <FiTag size={13} color={PRIMARY} /> {company.industry}
                </span>
              )}
              {location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: isDark ? '#94A3B8' : '#64748b', fontSize: 13 }}>
                  <FiMapPin size={13} color={PRIMARY} /> {location}
                </span>
              )}
              {openJobs.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: PRIMARY, fontSize: 13, fontWeight: 700 }}>
                  <FiBriefcase size={13} /> {openJobs.length} Open Position{openJobs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Website CTA */}
          {company.website && (
            <div style={{ paddingBottom: 18 }}>
              <a href={company.website} target="_blank" rel="noreferrer" style={primaryButton}
                onMouseEnter={e => { e.currentTarget.style.background = PRIMARY_DARK; }}
                onMouseLeave={e => { e.currentTarget.style.background = PRIMARY; }}
              >
                <FiExternalLink size={15} /> Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px', borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
          <div className="cd-tabs">
            {tabs.map(tab => (
              <button key={tab.id} className={`cd-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px' }}>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="cd-overview-grid">

            {/* Left: About + tagline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>

              {/* About */}
              <div style={{ ...cardBase(isDark), flex: 1 }}>
                <h2 style={sectionTitle(isDark)}>
                  <FiBriefcase size={18} color={PRIMARY} /> About {company.name}
                </h2>
                {company.tagline && (
                  <p style={{ fontSize: 15, color: PRIMARY_DARK, fontWeight: 600, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
                    &ldquo;{company.tagline}&rdquo;
                  </p>
                )}
                <p style={{ color: isDark ? '#C7D2E0' : '#475569', lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-line', margin: 0 }}>
                  {company.description || company.shortDescription || 'No description available.'}
                </p>
              </div>

              {/* Tech Stack */}
              {company.techStack?.length > 0 && (
                <div style={cardBase(isDark)}>
                  <h2 style={sectionTitle(isDark)}>
                    <FiAward size={18} color={PRIMARY} /> Tech Stack
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {company.techStack.map((tech, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        background: isDark ? 'rgba(37,99,235,0.12)' : PRIMARY_LIGHT, color: PRIMARY_DARK,
                        border: `1px solid ${PRIMARY_BORDER}`,
                      }}>{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {hasSocials && (
                <div style={cardBase(isDark)}>
                  <h2 style={sectionTitle(isDark)}>Follow Us</h2>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <SocialLink href={company.socialLinks?.linkedin} icon={FiLinkedin} label="LinkedIn" color="#0a66c2" />
                    <SocialLink href={company.socialLinks?.facebook} icon={FiFacebook} label="Facebook" color="#1877f2" />
                    <SocialLink href={company.socialLinks?.instagram} icon={FiInstagram} label="Instagram" color="#e1306c" />
                    <SocialLink href={company.socialLinks?.telegram} icon={FiSend} label="Telegram" color="#229ed9" />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>

              {/* Company Information (compact list) */}
              <div style={{ ...cardBase(isDark), height: '100%' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', marginBottom: 6 }}>Company Information</h3>
                <div>
                  <InfoRow icon={FiUsers} label="Company Size" value={company.companySize ? `${company.companySize} employees` : null} />
                  <InfoRow icon={FiCalendar} label="Founded" value={company.foundedYear} />
                  <InfoRow icon={FiTag} label="Type" value={company.companyType} />
                  <InfoRow icon={FiTag} label="Industry" value={company.industry} />
                  <InfoRow icon={FiMapPin} label="Location" value={location || null} />
                  {company.location?.address && (
                    <InfoRow icon={FiMapPin} label="Address" value={company.location.address} />
                  )}
                  <InfoRow icon={FiMail} label="Email" value={company.email} />
                  <InfoRow icon={FiPhone} label="Phone" value={company.phone} />
                  <InfoRow icon={FiGlobe} label="Website" value={company.website} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HR Contact (full-width below the grid, overview only) */}
        {activeTab === 'overview' && company.recruiter?.hrManagerName && (
          <div style={{ ...cardBase(isDark), marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', marginBottom: 12 }}>HR Contact</h3>
            <p style={{ fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', fontSize: 15, margin: '0 0 2px' }}>{company.recruiter.hrManagerName}</p>
            {company.recruiter.position && <p style={{ color: isDark ? '#94A3B8' : '#64748b', fontSize: 13, margin: '0 0 10px' }}>{company.recruiter.position}</p>}
            {company.recruiter.email && (
              <a href={`mailto:${company.recruiter.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: PRIMARY, fontSize: 13, textDecoration: 'none', marginBottom: 6, fontWeight: 500 }}>
                <FiMail size={14} /> {company.recruiter.email}
              </a>
            )}
            {company.recruiter.phone && (
              <a href={`tel:${company.recruiter.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: PRIMARY, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                <FiPhone size={14} /> {company.recruiter.phone}
              </a>
            )}
          </div>
        )}

        {/* ─── JOBS TAB ─── */}
        {activeTab === 'jobs' && (
          <div>
            {openJobs.length === 0 ? (
              <div style={{ ...cardBase(isDark), textAlign: 'center', padding: '56px 24px' }}>
                <FiBriefcase size={48} color={isDark ? '#475569' : '#cbd5e1'} style={{ marginBottom: 16 }} />
                <h3 style={{ color: isDark ? '#C7D2E0' : '#334155', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Open Positions</h3>
                <p style={{ color: isDark ? '#64748B' : '#94a3b8', fontSize: 14 }}>This company doesn&apos;t have any active job listings right now. Check back later!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', marginBottom: 4 }}>
                  {openJobs.length} Open Position{openJobs.length !== 1 ? 's' : ''} at {company.name}
                </h2>
                {openJobs.map((job) => {
                  const jLocation = [job.location?.city, job.location?.region].filter(Boolean).join(', ');
                  const color = jobTypeColor(job.jobType);
                  return (
                    <Link key={job._id} to={`/jobs/${job._id}`} className="job-card" style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: isDark ? '#0f172a' : '#fff', borderRadius: 14, padding: '18px 22px',
                        border: `1px solid ${isDark ? '#1e293b' : '#e8edf5'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 16, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
                            border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', background: hasLogo ? (isDark ? '#0f172a' : '#fff') : PRIMARY,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {hasLogo ? (
                              <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{initial}</span>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', fontSize: 15, margin: '0 0 4px' }}>{job.title}</p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {jLocation && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isDark ? '#94A3B8' : '#64748b', fontSize: 12 }}>
                                  <FiMapPin size={11} /> {jLocation}
                                </span>
                              )}
                              {job.applicationDeadline && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isDark ? '#94A3B8' : '#64748b', fontSize: 12 }}>
                                  <FiClock size={11} /> Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {job.jobType && (
                            <span style={{
                              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: `${color}18`, color, border: `1px solid ${color}30`,
                            }}>
                              {capitalize(job.jobType.replace('-', ' '))}
                            </span>
                          )}
                          <span style={{
                            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: PRIMARY, color: '#fff',
                          }}>
                            Apply →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── BENEFITS TAB ─── */}
        {activeTab === 'benefits' && (
          <div style={cardBase(isDark)}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#F4F8F6' : '#0f172a', marginBottom: 20 }}>Benefits &amp; Perks</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {company.benefits.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 12,
                  background: isDark ? 'rgba(37,99,235,0.10)' : PRIMARY_LIGHT,
                  border: `1px solid ${PRIMARY_BORDER}`,
                }}>
                  <FiCheckCircle size={16} color={PRIMARY} />
                  <span style={{ color: isDark ? '#93c5fd' : PRIMARY_DARKER, fontWeight: 600, fontSize: 14 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── back link ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 48px' }}>
        <Link to="/companies" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: isDark ? '#94A3B8' : '#64748b', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
          ← Back to All Companies
        </Link>
      </div>
    </div>
  );
};

export default CompanyDetails;
