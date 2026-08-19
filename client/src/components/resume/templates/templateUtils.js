export const RESUME_TEMPLATE_CSS = `
.resume-template-shell {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0;
}

.resume-template {
  width: 210mm;
  min-height: 297mm;
  padding: 0;
  background: var(--surface, white);
  color: var(--text, #111827);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  --accent: #2563eb;
  --accent-soft: #dbeafe;
  --accent-contrast: #eff6ff;
  --surface: #ffffff;
  --surface-alt: #f8fafc;
  --text: #111827;
  --text-muted: #475569;
  --border: rgba(15, 23, 42, 0.08);
}

.resume-template--compact {
  width: 100%;
  min-height: auto;
  box-shadow: none;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.resume-template__section {
  margin-bottom: 14px;
}

.resume-template__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 6px;
}

.resume-template__name {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}

.resume-template__profession {
  margin: 7px 0 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.45;
}

.resume-template__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--text-muted);
}

.resume-template__meta-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.resume-template__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 8px;
}

.resume-template__content {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-muted);
  white-space: pre-line;
}

.resume-template__list {
  margin: 0;
  padding-left: 16px;
  color: var(--text-muted);
}

.resume-template__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 7px 10px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
}

.resume-template__photo {
  width: 74px;
  height: 74px;
  object-fit: cover;
  border-radius: 999px;
  border: 2px solid var(--accent-soft);
  background: var(--accent-soft);
}

.resume-template__entry {
  margin-bottom: 12px;
}

.resume-template__entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.resume-template__entry-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.resume-template__entry-date {
  font-size: 11px;
  color: var(--text-muted);
}

.resume-template__entry-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    background: #fff;
    margin: 0;
  }

  .resume-template {
    width: 100%;
    min-height: 100vh;
    box-shadow: none;
    border-radius: 0;
    margin: 0;
  }

  @page {
    size: A4;
    margin: 0;
  }
}
`;

export const TEMPLATE_COLORS = {
  blue: { name: 'Blue', accent: '#2563eb', accentSoft: '#dbeafe', accentContrast: '#eff6ff' },
  purple: { name: 'Purple', accent: '#7c3aed', accentSoft: '#ede9fe', accentContrast: '#f5f3ff' },
  black: { name: 'Black', accent: '#111827', accentSoft: '#f3f4f6', accentContrast: '#f9fafb' },
  indigo: { name: 'Indigo', accent: '#4f46e5', accentSoft: '#e0e7ff', accentContrast: '#eef2ff' }
};

export const TEMPLATE_COLOR_NAMES = Object.keys(TEMPLATE_COLORS);

export const getColorTokens = (color = 'blue') => TEMPLATE_COLORS[color] || TEMPLATE_COLORS.blue;

/**
 * Build a persisted theme object for a template so the exact colors survive
 * Save / Reopen / Download without being derived only from a hard-coded default.
 * @param {string} color - One of TEMPLATE_COLOR_NAMES (blue, purple, black, indigo)
 * @returns {object} theme persisted on the resume
 */
export const getTemplateTheme = (color = 'blue') => {
  const tokens = getColorTokens(color);
  return {
    color,
    primaryColor: tokens.accent,
    secondaryColor: tokens.accentSoft,
    accentColor: tokens.accent,
    sidebarColor: tokens.accent,
    headingColor: tokens.accent,
    accentSoft: tokens.accentSoft,
    accentContrast: tokens.accentContrast,
    textColor: '#111827',
  };
};

/**
 * Resolve the single source of truth for the accent color of a resume.
 * Prefers the persisted theme (so Save/Reopen keeps colors), then falls
 * back to the template definition default for legacy resumes.
 * @param {object} resume - Saved CV data
 * @param {object} templateDefinition - Template definition with `accent`
 * @returns {string} color name
 */
export const getResumeThemeColor = (resume = {}, templateDefinition) => {
  if (resume?.theme?.color && TEMPLATE_COLORS[resume.theme.color]) return resume.theme.color;
  return templateDefinition?.accent || 'blue';
};

export const getInitials = (fullName = '') =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const getResumeViewModel = (resume = {}) => {
  const profile = resume.profile || {};

  const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ').trim();
  const profession = profile.profession || profile.headline || '';
  const location = [profile.streetAddress, profile.city, profile.stateProvince, profile.country || profile.nationality].filter(Boolean).join(', ');
  const contact = {
    email: profile.email || '',
    phone: profile.phone || '',
    location,
    nationality: profile.nationality || '',
    linkedin: profile.linkedin || profile.linkedIn || ''
  };

  const rawExperiences = Array.isArray(resume.experiences)
    ? resume.experiences
    : Array.isArray(resume.experience)
      ? resume.experience
      : resume.experience
        ? [resume.experience]
        : [];
  const experiences = rawExperiences
    .filter(Boolean)
    .map((exp) => ({
      jobTitle: exp.jobTitle || exp.title || '',
      employer: exp.employer || exp.company || '',
      city: exp.city || '',
      state: exp.state || '',
      startDate: exp.startDate || '',
      endDate: exp.currentWork ? 'Present' : (exp.endDate || ''),
      current: Boolean(exp.currentWork),
      duties: exp.duties || exp.description || ''
    }))
    .filter((exp) => exp.jobTitle || exp.employer || exp.duties);

  const rawEducations = Array.isArray(resume.education)
    ? resume.education
    : resume.education
      ? [resume.education]
      : [];
  const educations = rawEducations
    .filter(Boolean)
    .map((edu) => ({
      schoolName: edu.schoolName || edu.institution || '',
      degree: edu.degree || edu.studyType || '',
      fieldOfStudy: edu.fieldOfStudy || '',
      city: edu.city || '',
      state: edu.state || '',
      startDate: edu.startDate || '',
      endDate: edu.currentStudy ? 'Present' : (edu.endDate || '')
    }))
    .filter((edu) => edu.schoolName || edu.degree || edu.fieldOfStudy);

  const projects = Array.isArray(resume.projects) ? resume.projects.filter(Boolean) : [];
  const skills = Array.isArray(resume.skills) ? resume.skills.filter(Boolean) : [];
  const softSkills = Array.isArray(resume.softSkills) ? resume.softSkills.filter(Boolean) : [];
  const languages = Array.isArray(resume.languages)
    ? resume.languages
        .filter(Boolean)
        .map((language) => {
          if (typeof language === 'object') {
            const name = typeof language.name === 'string' ? language.name.trim() : '';
            const level = typeof language.level === 'string' ? language.level.trim() : '';
            return [name, level && level !== 'Select' ? level : null].filter(Boolean).join(' — ');
          }
          return String(language).trim();
        })
        .filter(Boolean)
    : [];
  const links = Array.isArray(resume.links) ? resume.links.filter(Boolean) : [];
  const certifications = (Array.isArray(resume.certifications) ? resume.certifications.filter(Boolean) : [])
    .map((cert) => {
      if (typeof cert === 'string') return { name: cert.trim(), issuer: '', year: '' };
      const name = cert?.name || cert?.title || cert?.certification || '';
      let year = cert?.year || '';
      if (!year && cert?.issueDate) year = new Date(cert.issueDate).getFullYear() || '';
      return {
        name: typeof name === 'string' ? name.trim() : '',
        issuer: typeof cert?.issuer === 'string' ? cert.issuer.trim() : '',
        year: String(year || '').trim(),
      };
    })
    .filter((cert) => cert.name);

  const rawSummary = resume.summary;
  const summary = typeof rawSummary === 'string' ? rawSummary.trim() : (typeof rawSummary?.text === 'string' ? rawSummary.text.trim() : '');
  const rawInterests = resume.interests;
  const interests = typeof rawInterests === 'string' ? rawInterests.trim() : (typeof rawInterests?.text === 'string' ? rawInterests.text.trim() : '');

  // Additional/custom sections (Awards, Volunteer, Publications, References, ...)
  const ADDITIONAL_INFO_LABELS = {
    awards: 'Awards',
    achievements: 'Achievements',
    volunteer: 'Volunteer Experience',
    publications: 'Publications',
    references: 'References',
    memberships: 'Professional Memberships',
    hobbies: 'Hobbies',
    interests: 'Interests',
    projects: 'Projects',
    custom: 'Additional Information',
  };
  const rawAdditionalInfo = resume.additionalInfo || {};

  // Resolve the display title for a section key. Custom sections created from
  // the builder store their own `title`, otherwise a known label is used.
  const resolveSectionTitle = (key, value) => {
    if (value && typeof value.title === 'string' && value.title.trim()) return value.title.trim();
    if (ADDITIONAL_INFO_LABELS[key]) return ADDITIONAL_INFO_LABELS[key];
    return key;
  };

  const buildSection = (key) => {
    const value = rawAdditionalInfo[key];
    if (value === null || value === undefined) return null;
    const entries = Array.isArray(value)
      ? value
      : value && Array.isArray(value.items)
        ? value.items
        : value && typeof value.text === 'string'
          ? [value.text]
          : value && typeof value === 'object'
            ? []
            : [];
    const items = entries
      .filter(Boolean)
      .map((item) =>
        typeof item === 'string'
          ? item
          : {
              title: item?.title || item?.name || '',
              description: item?.description || item?.detail || '',
            }
      )
      .filter((item) => (typeof item === 'string' ? item.trim() : item.title || item.description));
    if (items.length === 0) return null;
    return { key, title: resolveSectionTitle(key, value), items };
  };

  // Order custom sections using the persisted sectionOrder so reordering made
  // in the Resume Builder is reflected in the live preview and downloaded PDF.
  const sectionOrder = Array.isArray(resume.sectionOrder) ? resume.sectionOrder : [];
  const sectionKeys = Object.keys(rawAdditionalInfo);
  const orderedKeys = [
    ...sectionOrder.filter((key) => sectionKeys.includes(key)),
    ...sectionKeys.filter((key) => !sectionOrder.includes(key)),
  ];
  const additionalInfo = orderedKeys
    .map(buildSection)
    .filter(Boolean);

  return {
    fullName,
    profession,
    summary,
    interests,
    contact,
    links,
    certifications,
    experiences,
    educations,
    experience: experiences[0] || {},
    education: educations[0] || {},
    projects,
    skills,
    softSkills,
    languages,
    additionalInfo,
    photo: resume.photo?.dataUrl || resume.photo?.url || null
  };
};
