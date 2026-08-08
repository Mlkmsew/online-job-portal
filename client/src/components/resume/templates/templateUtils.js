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
  green: { name: 'Green', accent: '#059669', accentSoft: '#dcfce7', accentContrast: '#f0fdf4' },
  purple: { name: 'Purple', accent: '#7c3aed', accentSoft: '#ede9fe', accentContrast: '#f5f3ff' },
  black: { name: 'Black', accent: '#111827', accentSoft: '#f3f4f6', accentContrast: '#f9fafb' },
  teal: { name: 'Teal', accent: '#0f766e', accentSoft: '#ccfbf1', accentContrast: '#f0fdfa' }
};

export const getColorTokens = (color = 'blue') => TEMPLATE_COLORS[color] || TEMPLATE_COLORS.blue;

export const getInitials = (fullName = '') =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const getResumeViewModel = (resume = {}) => {
  const profile = resume.profile || {};
  const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ').trim() || 'Your Name';
  const profession = profile.profession || 'Professional Title';
  const location = [profile.city, profile.stateProvince, profile.country || profile.nationality].filter(Boolean).join(', ');
  const contact = {
    email: profile.email || 'your@email.com',
    phone: profile.phone || '+1 555 0100',
    location: location || 'City, State',
    nationality: profile.nationality || 'Open to work'
  };
  const experience = resume.experience || {};
  const education = resume.education || {};
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
  const certifications = Array.isArray(resume.certifications) ? resume.certifications.filter(Boolean) : [];

  return {
    fullName,
    profession,
    summary: resume.summary?.text || 'A results-focused professional with a strong track record of delivering measurable impact through thoughtful planning, clear communication, and continuous improvement.',
    interests: resume.interests?.text || 'Leadership, mentoring, continuous learning, and collaboration.',
    contact,
    links,
    certifications,
    experience: {
      jobTitle: experience.jobTitle || 'Senior Professional',
      employer: experience.employer || 'Organization',
      city: experience.city || 'City',
      state: experience.state || 'State',
      startDate: experience.startDate || '2020',
      endDate: experience.currentWork ? 'Present' : (experience.endDate || '2024'),
      duties: experience.duties || 'Describe your role, impact, and key accomplishments in this position.'
    },
    education: {
      schoolName: education.schoolName || 'University',
      degree: education.degree || 'Bachelor\'s Degree',
      fieldOfStudy: education.fieldOfStudy || 'Field of Study',
      city: education.city || 'City',
      state: education.state || 'State',
      startDate: education.startDate || '2016',
      endDate: education.currentStudy ? 'Present' : (education.endDate || '2020')
    },
    projects: projects.length ? projects : [{ title: 'Featured Project', description: 'Highlight measurable results, team collaboration, and the value you delivered.' }],
    skills: skills.length ? skills : [{ name: 'Leadership' }, { name: 'Communication' }, { name: 'Problem Solving' }],
    softSkills,
    languages: languages.length ? languages : ['English', 'Spanish'],
    photo: resume.photo?.dataUrl || null
  };
};
