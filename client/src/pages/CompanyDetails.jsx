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

// ── helpers ──────────────────────────────────────────────────────────────────
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

// ── sub-components ────────────────────────────────────────────────────────────
const InfoBadge = ({ icon: Icon, label, value }) =>
  value ? (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.6)',
      border: '1px solid rgba(16,185,129,0.12)',
      borderRadius: '12px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '8px',
        background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color="#059669" />
      </div>
      <div>
        <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '14px', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>{value}</p>
      </div>
    </div>
  ) : null;

const Tag = ({ label, color = '#10b981' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
    background: `${color}18`, color, border: `1px solid ${color}30`,
  }}>
    {label}
  </span>
);

const SocialLink = ({ href, icon: Icon, label, color }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" title={label} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 40, height: 40, borderRadius: '10px',
      background: `${color}15`, color,
      border: `1px solid ${color}30`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      textDecoration: 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <Icon size={18} />
    </a>
  ) : null;

// ── main page ─────────────────────────────────────────────────────────────────
const CompanyDetails = () => {
  const { t } = useTranslation();
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
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid #d1fae5', borderTopColor: '#10b981',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <FiBriefcase size={48} color="#d1d5db" />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Company not found.</p>
        <Link to="/companies" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>← Back to Companies</Link>
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
    <div style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 50%,#f8fafc 100%)', minHeight: '100vh', fontFamily: "'Inter','Outfit',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .cd-tab { background:transparent; border:none; cursor:pointer; padding:10px 20px; font-size:14px; font-weight:600; color:#6b7280; border-bottom:2px solid transparent; transition:all 0.2s; }
        .cd-tab.active { color:#10b981; border-bottom-color:#10b981; }
        .cd-tab:hover { color:#10b981; }
        .job-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(16,185,129,0.12)!important; }
        .job-card { transition:transform 0.2s,box-shadow 0.2s; }
      `}</style>

      {/* ── HERO / COVER ───────────────────────────────────────────── */}
      <div style={{
        background: company.coverImage
          ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.55)), url(${company.coverImage}) center/cover no-repeat`
          : 'linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%)',
        minHeight: 220,
        position: 'relative',
      }}>
        {!company.coverImage && <>
          <div style={{ position: 'absolute', top: 30, right: '15%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 20, left: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        </>}
      </div>

      {/* ── PROFILE STRIP ───────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>

          {/* Logo */}
          <div style={{
            width: 100, height: 100, borderRadius: 20,
            border: '4px solid #fff',
            background: hasLogo ? '#fff' : 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
            overflow: 'hidden', flexShrink: 0,
            marginTop: -50,
          }}>
            {hasLogo ? (
              <img src={company.logo} alt={company.name} onError={() => setLogoFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>{initial}</span>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 200, paddingBottom: 16, paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#111827', margin: 0 }}>{company.name}</h1>
              {company.isVerified && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                  background: '#ecfdf5', color: '#059669', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: '1px solid #a7f3d0',
                }}>
                  <FiCheckCircle size={12} /> Verified
                </span>
              )}
              {company.isFeatured && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                  background: '#fef3c7', color: '#d97706', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: '1px solid #fde68a',
                }}>
                  <FiStar size={12} /> Featured
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
              {company.industry && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13 }}>
                  <FiTag size={13} color="#10b981" /> {company.industry}
                </span>
              )}
              {location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13 }}>
                  <FiMapPin size={13} color="#10b981" /> {location}
                </span>
              )}
              {openJobs.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 13, fontWeight: 700 }}>
                  <FiBriefcase size={13} /> {openJobs.length} Open Position{openJobs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Website CTA */}
          {company.website && (
            <div style={{ paddingBottom: 20 }}>
              <a href={company.website} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                textDecoration: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)'; }}
              >
                <FiExternalLink size={15} /> Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', display: 'flex', borderTop: '1px solid #f3f4f6' }}>
          {tabs.map(tab => (
            <button key={tab.id} className={`cd-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', animation: 'fadeUp 0.4s ease both' }}>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 28, alignItems: 'start' }}>

            {/* Left: About + tagline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* About */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiBriefcase size={18} color="#10b981" /> About {company.name}
                </h2>
                {company.tagline && (
                  <p style={{ fontSize: 15, color: '#059669', fontWeight: 600, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
                    &ldquo;{company.tagline}&rdquo;
                  </p>
                )}
                <p style={{ color: '#374151', lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-line' }}>
                  {company.description || company.shortDescription || 'No description available.'}
                </p>
              </div>

              {/* Tech Stack */}
              {company.techStack?.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiAward size={18} color="#10b981" /> Tech Stack
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {company.techStack.map((tech, i) => (
                      <Tag key={i} label={tech} color="#6366f1" />
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {hasSocials && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Follow Us</h2>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Quick stats */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Company Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoBadge icon={FiUsers} label="Company Size" value={company.companySize ? `${company.companySize} employees` : null} />
                  <InfoBadge icon={FiCalendar} label="Founded" value={company.foundedYear} />
                  <InfoBadge icon={FiTag} label="Type" value={company.companyType} />
                  <InfoBadge icon={FiTag} label="Industry" value={company.industry} />
                  <InfoBadge icon={FiMapPin} label="Location" value={location || null} />
                  {company.location?.address && (
                    <InfoBadge icon={FiMapPin} label="Address" value={company.location.address} />
                  )}
                  <InfoBadge icon={FiMail} label="Email" value={company.email} />
                  <InfoBadge icon={FiPhone} label="Phone" value={company.phone} />
                  <InfoBadge icon={FiGlobe} label="Website" value={company.website} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius: 16, padding: 20, border: '1px solid #a7f3d0' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#065f46', marginBottom: 14 }}>At a Glance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: FiBriefcase, label: 'Open Jobs', value: openJobs.length },
                    { icon: FiUsers, label: 'Total Hires', value: company.totalHires || 0 },
                    { icon: FiStar, label: 'Rating', value: company.averageRating ? `${company.averageRating.toFixed(1)} / 5` : 'N/A' },
                    { icon: FiAward, label: 'Reviews', value: company.totalReviews || 0 },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                      <Icon size={18} color="#059669" style={{ margin: '0 auto 4px' }} />
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#065f46', margin: 0 }}>{value}</p>
                      <p style={{ fontSize: 11, color: '#047857', margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter */}
              {company.recruiter?.hrManagerName && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>HR Contact</h3>
                  <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: '0 0 2px' }}>{company.recruiter.hrManagerName}</p>
                  {company.recruiter.position && <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 8px' }}>{company.recruiter.position}</p>}
                  {company.recruiter.email && (
                    <a href={`mailto:${company.recruiter.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 13, textDecoration: 'none', marginBottom: 4 }}>
                      <FiMail size={13} /> {company.recruiter.email}
                    </a>
                  )}
                  {company.recruiter.phone && (
                    <a href={`tel:${company.recruiter.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 13, textDecoration: 'none' }}>
                      <FiPhone size={13} /> {company.recruiter.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── JOBS TAB ─── */}
        {activeTab === 'jobs' && (
          <div>
            {openJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6' }}>
                <FiBriefcase size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
                <h3 style={{ color: '#374151', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Open Positions</h3>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>This company doesn&apos;t have any active job listings right now. Check back later!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {openJobs.length} Open Position{openJobs.length !== 1 ? 's' : ''} at {company.name}
                </h2>
                {openJobs.map((job) => {
                  const jLocation = [job.location?.city, job.location?.region].filter(Boolean).join(', ');
                  const color = jobTypeColor(job.jobType);
                  return (
                    <Link key={job._id} to={`/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
                      <div className="job-card" style={{
                        background: '#fff', borderRadius: 16, padding: '20px 24px',
                        border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 16, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
                            border: '1px solid #f3f4f6', background: hasLogo ? '#fff' : 'linear-gradient(135deg,#10b981,#059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {hasLogo ? (
                              <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{initial}</span>
                            )}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: '#111827', fontSize: 15, margin: '0 0 4px' }}>{job.title}</p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {jLocation && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 12 }}>
                                  <FiMapPin size={11} /> {jLocation}
                                </span>
                              )}
                              {job.applicationDeadline && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 12 }}>
                                  <FiClock size={11} /> Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {job.jobType && (
                            <span style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                              background: `${color}18`, color, border: `1px solid ${color}30`,
                            }}>
                              {capitalize(job.jobType.replace('-', ' '))}
                            </span>
                          )}
                          <span style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
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
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Benefits &amp; Perks</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {company.benefits.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
                  border: '1px solid #a7f3d0',
                }}>
                  <FiCheckCircle size={16} color="#10b981" />
                  <span style={{ color: '#065f46', fontWeight: 600, fontSize: 14 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── back link ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 48px' }}>
        <Link to="/companies" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
          ← Back to All Companies
        </Link>
      </div>
    </div>
  );
};

export default CompanyDetails;
