import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchAdminUser, updateUserStatus } from '../../store/slices/adminSlice';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiMapPin,
  FiStar,
  FiGlobe,
  FiLink,
  FiFileText,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiExternalLink,
  FiDownload,
  FiHome,
  FiCalendar,
  FiEye,
  FiX,
  FiShield,
  FiUsers,
} from 'react-icons/fi';

/* ── Small presentational helpers ─────────────────────────────────────────── */

const ROLE_STYLES = {
  jobseeker: 'bg-sky-50 text-sky-700 ring-sky-200',
  employer: 'bg-violet-50 text-violet-700 ring-violet-200',
  admin: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const ROLE_LABELS = { jobseeker: 'Job Seeker', employer: 'Employer', admin: 'Admin' };

const STATUS_META = {
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: FiCheckCircle },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: FiClock },
  suspended: { label: 'Suspended', cls: 'bg-orange-50 text-orange-700 ring-orange-200', icon: FiAlertCircle },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-red-200', icon: FiXCircle },
};

const JOB_STATUS_META = {
  published: { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  draft: { label: 'Draft', cls: 'bg-gray-50 text-gray-600 ring-gray-200' },
  closed: { label: 'Closed', cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  paused: { label: 'Paused', cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
};

const getInitials = (u) => `${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase() || '?';

const getUserStatus = (u) => u?.status || (u?.isSuspended ? 'suspended' : u?.isActive === false ? 'rejected' : 'active');

const Field = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-gray-100 break-words">{value || '—'}</p>
  </div>
);

const SectionCard = ({ icon: Icon, title, children, accent = 'bg-emerald-100 text-emerald-700' }) => (
  <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-gray-700">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="space-y-1">
    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h1>
    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </div>
);

/* ── Avatar with initials fallback ────────────────────────────────────────── */

const ProfileAvatar = ({ user, size = 'h-24 w-24', text = 'text-3xl' }) => (
  <div
    className={`flex ${size} flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 font-black text-white shadow-lg ring-4 ring-emerald-100 ${text}`}
  >
    {user?.avatar ? (
      <img src={user.avatar} alt={user?.firstName || 'User'} className="h-full w-full object-cover" />
    ) : (
      getInitials(user)
    )}
  </div>
);

/* ── Status badges ────────────────────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${meta.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {t(`admin.users.status.${status}`, { defaultValue: meta.label })}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  const label = t(`admin.users.role.${role}`, { defaultValue: ROLE_LABELS[role] || role });
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ring-1 ${ROLE_STYLES[role] || ROLE_STYLES.jobseeker}`}>
      <FiUser className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

/* ── Section builders ─────────────────────────────────────────────────────── */

const formatLocation = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'string') return loc;
  return [loc.city, loc.region, loc.address].filter(Boolean).join(', ') || null;
};

const normalizeSkillNames = (user) => {
  if (Array.isArray(user?.skillNames) && user.skillNames.length > 0) return user.skillNames;
  if (Array.isArray(user?.skills) && user.skills.length > 0) {
    return user.skills.map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean);
  }
  return [];
};

const JobSeekerProfileView = ({ user }) => {
  const { t } = useTranslation();
  const skills = normalizeSkillNames(user);
  const education = useMemo(
    () => (Array.isArray(user?.educationDetails) && user.educationDetails.length > 0
      ? user.educationDetails
      : Array.isArray(user?.education)
        ? user.education.map((e) => (typeof e === 'object' ? e : { degree: e }))
        : []),
    [user]
  );
  const experience = useMemo(
    () => (Array.isArray(user?.experienceDetails) && user.experienceDetails.length > 0
      ? user.experienceDetails
      : user?.experience
        ? [{ title: 'Work History', description: user.experience }]
        : []),
    [user]
  );
  const languages = Array.isArray(user?.languages) ? user.languages : [];
  const portfolio = Array.isArray(user?.portfolio) ? user.portfolio : [];

  const location = formatLocation(user?.location);
  const resumeUrl = user?.cv || null;
  const resumeName = user?.cvOriginalName || (user?.cv ? user.cv.split('/').pop() : null);

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <SectionCard icon={FiUser} title={t('admin.userProfile.personalInfo', { defaultValue: 'Personal Information' })}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('admin.userProfile.firstName', { defaultValue: 'First name' })} value={user.firstName} />
          <Field label={t('admin.userProfile.lastName', { defaultValue: 'Last name' })} value={user.lastName} />
          <Field icon={FiMail} label={t('admin.userProfile.email', { defaultValue: 'Email' })} value={user.email} />
          <Field icon={FiPhone} label={t('admin.userProfile.phone', { defaultValue: 'Phone' })} value={user.phone} />
          <Field icon={FiMapPin} label={t('admin.userProfile.location', { defaultValue: 'Location' })} value={location} />
          <Field label={t('admin.userProfile.gender', { defaultValue: 'Gender' })} value={user.gender} />
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('admin.userProfile.bio', { defaultValue: 'Bio / About me' })}
          </p>
          <p className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 dark:text-gray-200">
            {user?.bio || '—'}
          </p>
        </div>
      </SectionCard>

      {/* Professional Information */}
      <SectionCard icon={FiBriefcase} title={t('admin.userProfile.professionalInfo', { defaultValue: 'Professional Information' })}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('admin.userProfile.professionalTitle', { defaultValue: 'Professional title' })} value={user.headline} />
          <Field label={t('admin.userProfile.currentRole', { defaultValue: 'Current role' })} value={user.currentRole} />
          <Field
            label={t('admin.userProfile.experienceYears', { defaultValue: 'Years of experience' })}
            value={user.experienceYears != null ? `${user.experienceYears} yrs` : user?.resumeAnalysis?.experienceYears != null ? `${user.resumeAnalysis.experienceYears} yrs` : null}
          />
          <Field label={t('admin.userProfile.salaryExpectation', { defaultValue: 'Expected salary' })} value={user.salaryExpectation} />
          <Field label={t('admin.userProfile.availability', { defaultValue: 'Availability' })} value={user.availability} />
          <Field label={t('admin.userProfile.employmentStatus', { defaultValue: 'Employment status' })} value={user.availability} />
        </div>
        {user?.bio && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('admin.userProfile.careerSummary', { defaultValue: 'Career summary' })}
            </p>
            <p className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 dark:text-gray-200">
              {user.bio}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Education */}
      <SectionCard icon={FiBookOpen} title={t('profile.education', { defaultValue: 'Education' })}>
        {education.length > 0 ? (
          <div className="space-y-4">
            {education.map((edu, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{edu.degree || '—'}</h3>
                  {(edu.startDate || edu.endDate) && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <FiCalendar className="h-3.5 w-3.5" />
                      {edu.startDate || ''} {edu.endDate ? `– ${edu.endDate}` : ''}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-semibold text-emerald-700">{edu.institution || '—'}</p>
                {edu.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <FiMapPin className="h-3 w-3" />
                    {edu.location}
                  </p>
                )}
                {edu.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-gray-300">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('profile.noEducation', { defaultValue: 'No education records added.' })}</p>
        )}
      </SectionCard>

      {/* Work Experience */}
      <SectionCard icon={FiBriefcase} title={t('profile.workExperience', { defaultValue: 'Work Experience' })}>
        {experience.length > 0 ? (
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{exp.title || '—'}</h3>
                  {(exp.startDate || exp.endDate) && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <FiClock className="h-3.5 w-3.5" />
                      {exp.startDate || ''} {exp.endDate ? `– ${exp.endDate}` : '– Present'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-semibold text-emerald-700">{exp.company || '—'}</p>
                {exp.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <FiMapPin className="h-3 w-3" />
                    {exp.location}
                  </p>
                )}
                {exp.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-gray-300">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('profile.noExperience', { defaultValue: 'No work experience added.' })}</p>
        )}
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={FiStar} title={t('profile.skills', { defaultValue: 'Skills' })}>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800"
              >
                <FiStar className="h-3 w-3" />
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('profile.noSkills', { defaultValue: 'No skills added.' })}</p>
        )}
      </SectionCard>

      {/* Languages */}
      <SectionCard icon={FiGlobe} title={t('profile.languages', { defaultValue: 'Languages' })}>
        {languages.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {languages.map((lang, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
                <p className="text-sm font-bold text-slate-800 dark:text-gray-100">{lang.name || '—'}</p>
                <span className="text-xs font-semibold text-emerald-700">{lang.level || ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('profile.noLanguages', { defaultValue: 'No languages added.' })}</p>
        )}
      </SectionCard>

      {/* CV / Resume */}
      <SectionCard icon={FiFileText} title={t('profile.cvResume', { defaultValue: 'CV / Resume' })} accent="bg-rose-100 text-rose-700">
        {resumeUrl ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <FiFileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-gray-100">{resumeName || 'Resume'}</p>
                <p className="text-xs text-slate-400">{t('admin.userProfile.cvAttached', { defaultValue: 'Resume attached to this profile' })}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#1769E0] bg-[#EAF2FE] px-4 py-2 text-xs font-bold text-[#1769E0] transition hover:bg-[#DCEAFD]"
              >
                <FiEye className="h-3.5 w-3.5" />
                {t('admin.userProfile.viewCV', { defaultValue: 'View CV' })}
              </a>
              <a
                href={resumeUrl}
                download={resumeName}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1769E0] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0D5BC4]"
              >
                <FiDownload className="h-3.5 w-3.5" />
                {t('admin.userProfile.downloadCV', { defaultValue: 'Download CV' })}
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('admin.userProfile.noCV', { defaultValue: 'No CV uploaded.' })}</p>
        )}
      </SectionCard>

      {/* Portfolio */}
      <SectionCard icon={FiLink} title={t('profile.portfolio', { defaultValue: 'Portfolio' })}>
        {portfolio.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {portfolio.map((item, idx) => (
              <a
                key={idx}
                href={item.url?.startsWith('http') ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-[#1769E0] hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1769E0]">{item.label || item.url}</p>
                  <p className="truncate text-xs text-slate-400">{item.url}</p>
                </div>
                <FiExternalLink className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-[#1769E0]" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('profile.noPortfolio', { defaultValue: 'No portfolio links added.' })}</p>
        )}
      </SectionCard>
    </div>
  );
};

const EmployerProfileView = ({ user, company, jobs }) => {
  const { t } = useTranslation();
  const loc = company ? formatLocation(company.location) : null;
  const companyName = company?.name;
  const initial = (companyName || user.lastName || 'C').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <SectionCard icon={FiHome} title={t('admin.userProfile.companyInfo', { defaultValue: 'Company Information' })}>
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-3xl font-black text-emerald-700 shadow-sm">
            {company?.logo ? (
              <img src={company.logo} alt={companyName || 'Company'} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{companyName || '—'}</h3>
            {company?.tagline && <p className="text-sm text-slate-500">{company.tagline}</p>}
            <div className="mt-1.5 flex flex-wrap gap-2">
              {company?.isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <FiCheckCircle className="h-3 w-3" /> {t('admin.userProfile.companyApproved', { defaultValue: 'Approved' })}
                </span>
              )}
              {company?.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200">
                  <FiShield className="h-3 w-3" /> {t('admin.userProfile.companyVerified', { defaultValue: 'Verified' })}
                </span>
              )}
              {company?.isActive === false && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200">
                  <FiXCircle className="h-3 w-3" /> {t('admin.userProfile.companyInactive', { defaultValue: 'Inactive' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('admin.userProfile.companyName', { defaultValue: 'Company name' })} value={companyName} />
          <Field label={t('admin.userProfile.industry', { defaultValue: 'Industry' })} value={company?.industry} />
          <Field label={t('admin.userProfile.companySize', { defaultValue: 'Company size' })} value={company?.companySize} />
          <Field label={t('admin.userProfile.companyType', { defaultValue: 'Company type' })} value={company?.companyType} />
          <Field label={t('admin.userProfile.foundedYear', { defaultValue: 'Founded year' })} value={company?.foundedYear} />
          <Field label={t('admin.userProfile.website', { defaultValue: 'Website' })} value={company?.website} />
          <Field label={t('admin.userProfile.companyEmail', { defaultValue: 'Business email' })} value={company?.email} />
          <Field label={t('admin.userProfile.companyPhone', { defaultValue: 'Phone' })} value={company?.phone} />
          <Field label={t('admin.userProfile.location', { defaultValue: 'Location' })} value={loc} />
        </div>

        {company?.description && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('admin.userProfile.companyDescription', { defaultValue: 'Company description' })}
            </p>
            <p className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 dark:text-gray-200">
              {company.description}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Employer / Contact Information */}
      <SectionCard icon={FiUsers} title={t('admin.userProfile.employerInfo', { defaultValue: 'Employer Information' })}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label={t('admin.userProfile.owner', { defaultValue: 'Owner / contact person' })}
            value={company?.recruiter?.hrManagerName || `${user.firstName} ${user.lastName}`}
          />
          <Field label={t('admin.userProfile.employerPosition', { defaultValue: 'Position' })} value={company?.recruiter?.position || (user.headline || 'Owner')} />
          <Field label={t('admin.userProfile.email', { defaultValue: 'Email' })} value={company?.recruiter?.email || user.email} />
          <Field label={t('admin.userProfile.phone', { defaultValue: 'Phone' })} value={company?.recruiter?.phone || user.phone} />
        </div>
      </SectionCard>

      {/* Posted Jobs */}
      <SectionCard icon={FiBriefcase} title={t('admin.userProfile.postedJobs', { defaultValue: 'Posted Jobs' })}>
        {jobs && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const meta = JOB_STATUS_META[job.status] || JOB_STATUS_META.pending;
              const location = [job.location?.city, job.location?.region].filter(Boolean).join(', ') || '—';
              const posted = job.createdAt ? format(new Date(job.createdAt), 'dd MMM yyyy') : '—';
              const categoryName = typeof job.category === 'object' ? job.category?.name : null;
              return (
                <Link
                  key={job._id}
                  to={`/admin/jobs`}
                  className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-[#1769E0] hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 dark:text-white">{job.title}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {categoryName && <span>{categoryName}</span>}
                        <span className="inline-flex items-center gap-1"><FiMapPin className="h-3 w-3" />{location}</span>
                        <span className="inline-flex items-center gap-1"><FiBriefcase className="h-3 w-3" />{job.jobType || '—'}</span>
                        <span className="inline-flex items-center gap-1"><FiUsers className="h-3 w-3" />{job.applicantsCount || 0} {t('admin.userProfile.applicants', { defaultValue: 'applicants' })}</span>
                        <span className="inline-flex items-center gap-1"><FiClock className="h-3 w-3" />{posted}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      {t('admin.userProfile.manageJob', { defaultValue: 'Manage job' })}
                      <FiExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('admin.userProfile.noJobs', { defaultValue: 'No jobs posted yet.' })}</p>
        )}
      </SectionCard>
    </div>
  );
};

/* ── Confirmation / rejection modals ──────────────────────────────────────── */

const ConfirmModal = ({ title, message, confirmLabel, loading, onConfirm, onCancel, danger = false }) => {
  const { t } = useTranslation();
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          <FiAlertCircle className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          {t('admin.users.cancel', { defaultValue: 'Cancel' })}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1769E0] hover:bg-[#0D5BC4]'}`}
        >
          {loading ? (t('admin.users.processing', { defaultValue: 'Processing...' })) : confirmLabel}
        </button>
      </div>
    </div>
  </div>
  );
};

const RejectModal = ({ title, loading, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiXCircle className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('admin.userProfile.rejectionReason', { defaultValue: 'Rejection reason' })}
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('admin.userProfile.rejectionReasonPlaceholder', { defaultValue: 'e.g. Your profile information is incomplete.' })}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            {t('admin.users.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(reason)}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (t('admin.users.processing', { defaultValue: 'Processing...' })) : (t('admin.users.reject', { defaultValue: 'Reject' }))}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────────────────── */

const UserProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { key, status, title, message, danger }
  const [rejectOpen, setRejectOpen] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await dispatch(fetchAdminUser(id)).unwrap();
      setProfile(data);
    } catch (err) {
      setLoadError(err || (t('admin.userProfile.loadFailed', { defaultValue: 'Failed to load user profile' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const user = profile?.user || null;
  const status = getUserStatus(user);
  const company = profile?.company || null;
  const jobs = profile?.jobs || [];

  const actions = useMemo(() => {
    switch (status) {
      case 'pending':
        return [
          { key: 'approve', status: 'active', title: t('admin.users.approve', { defaultValue: 'Approve' }), message: t('admin.userProfile.approveConfirm', { defaultValue: 'Are you sure you want to approve this user?' }), danger: false },
          { key: 'reject', status: 'rejected', title: t('admin.users.reject', { defaultValue: 'Reject' }), danger: true },
        ];
      case 'suspended':
        return [
          { key: 'activate', status: 'active', title: t('admin.users.activate', { defaultValue: 'Activate' }), message: t('admin.userProfile.activateConfirm', { defaultValue: 'Are you sure you want to activate this user?' }), danger: false },
        ];
      case 'rejected':
        return [
          { key: 'approve', status: 'active', title: t('admin.users.approve', { defaultValue: 'Approve' }), message: t('admin.userProfile.approveConfirm', { defaultValue: 'Are you sure you want to approve this user?' }), danger: false },
        ];
      case 'active':
      default:
        return [
          { key: 'suspend', status: 'suspended', title: t('admin.users.suspend', { defaultValue: 'Suspend' }), message: t('admin.userProfile.suspendConfirm', { defaultValue: 'Are you sure you want to suspend this user?' }), danger: true },
        ];
    }
  }, [status, t]);

  const runAction = async ({ status: nextStatus, reason }) => {
    setActionLoading(true);
    try {
      const res = await dispatch(updateUserStatus({ userId: id, status: nextStatus, reason })).unwrap();
      toast.success(res?.message || (t('admin.users.statusSuccess', { defaultValue: 'User status updated successfully' })));
      setProfile((prev) => (prev ? { ...prev, user: res?.data || prev.user } : prev));
      setConfirmAction(null);
      setRejectOpen(false);
    } catch (err) {
      toast.error(err || (t('admin.users.statusFailed', { defaultValue: 'Unable to update user status' })));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    runAction({ status: confirmAction.status });
  };

  const handleReject = (reason) => {
    if (!reason.trim()) {
      toast.error(t('admin.userProfile.rejectionRequired', { defaultValue: 'A rejection reason is required.' }));
      return;
    }
    runAction({ status: 'rejected', reason: reason.trim() });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title={t('admin.userProfile.loading', { defaultValue: 'Loading user...' })} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-3xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-100 bg-white py-20 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <FiAlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {loadError || t('admin.userProfile.notFound', { defaultValue: 'User not found.' })}
        </p>
        <Link to="/admin/users" className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
          {t('admin.userProfile.backToUsers', { defaultValue: 'Back to users' })}
        </Link>
      </div>
    );
  }

  const registered = user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—';
  const lastLogin = user?.lastLogin ? format(new Date(user.lastLogin), 'dd MMM yyyy') : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/admin/users')}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <FiArrowLeft className="h-4 w-4" />
        {t('admin.userProfile.backToUsers', { defaultValue: 'Back to users' })}
      </button>

      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-50 blur-2xl dark:bg-emerald-500/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar user={user} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <RoleBadge role={user.role} />
              <StatusBadge status={status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <FiMail className="h-4 w-4" />
                {user.email}
              </span>
              {lastLogin && (
                <span className="inline-flex items-center gap-1.5">
                  <FiClock className="h-4 w-4" />
                  {t('admin.userProfile.lastLogin', { defaultValue: 'Last login' })}: {lastLogin}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <FiCalendar className="h-4 w-4" />
                {t('admin.users.registered', { defaultValue: 'Registered' })}: {registered}
              </span>
            </div>
            {status === 'rejected' && user.rejectionReason && (
              <div className="mt-3 inline-flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                <FiAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>{t('admin.userProfile.rejectionReason', { defaultValue: 'Rejection reason' })}:</strong> {user.rejectionReason}
                </span>
              </div>
            )}
          </div>

          {/* Admin actions */}
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) =>
              action.key === 'reject' ? (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                >
                  <FiXCircle className="h-4 w-4" />
                  {action.title}
                </button>
              ) : (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setConfirmAction(action)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-sm transition ${
                    action.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1769E0] hover:bg-[#0D5BC4]'
                  }`}
                >
                  <FiCheckCircle className="h-4 w-4" />
                  {action.title}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Role-based profile */}
      {user.role === 'employer' ? (
        <EmployerProfileView user={user} company={company} jobs={jobs} />
      ) : (
        <JobSeekerProfileView user={user} />
      )}

      {/* Modals */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.title}
          danger={confirmAction.danger}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {rejectOpen && (
        <RejectModal
          title={t('admin.users.reject', { defaultValue: 'Reject' })}
          loading={actionLoading}
          onConfirm={handleReject}
          onCancel={() => setRejectOpen(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
