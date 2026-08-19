import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const ModernATS = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--accent-contrast': tokens.accentContrast, '--surface': '#ffffff', '--surface-alt': '#f8fafc' };

  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location;
  const hasSkills = (view.skills || []).filter((skill) => skill?.name).length > 0;
  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasExperience = experiences.length > 0;
  const hasEducation = educations.length > 0;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', minHeight: '100%' }}>
          <div style={{ background: 'var(--surface-alt)', padding: '28px 24px', borderRight: '1px solid var(--border)' }}>
            <div className="resume-template__section">
              <div className="resume-template__profile">
                {view.photo ? (
                  <img src={view.photo} alt="Profile" className="resume-template__profile-photo" />
                ) : (
                  <div className="resume-template__profile-initials">{initials}</div>
                )}
                <div className="resume-template__profile-info">
                  <p className="resume-template__profile-name">{view.fullName}</p>
                  {view.profession && <p className="resume-template__profile-title">{view.profession}</p>}
                </div>
              </div>
            </div>
            {hasContact && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Contact</p>
                {view.contact?.email && <div className="resume-template__content">{view.contact.email}</div>}
                {view.contact?.phone && <div className="resume-template__content">{view.contact.phone}</div>}
                {view.contact?.location && <div className="resume-template__content">{view.contact.location}</div>}
              </div>
            )}
            {hasSkills && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(view.skills || []).filter((skill) => skill?.name).map((skill, index) => (
                    <span key={`${skill.name}-${index}`} className="resume-template__pill">{skill.name}</span>
                  ))}
                </div>
              </div>
            )}
            {(view.softSkills || []).filter(Boolean).length > 0 && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Soft Skills</p>
                <ul className="resume-template__list">
                  {(view.softSkills || []).filter(Boolean).map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}
                </ul>
              </div>
            )}
            {(view.languages || []).filter(Boolean).length > 0 && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Languages</p>
                <ul className="resume-template__list">
                  {(view.languages || []).filter(Boolean).map((language, index) => <li key={`${language}-${index}`}>{language}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 className="resume-template__name">{view.fullName}</h2>
              <p className="resume-template__profession">{view.profession}</p>
              {hasContact && (
                <div className="resume-template__meta">
                  {view.contact?.location && <span className="resume-template__meta-item">📍 {view.contact.location}</span>}
                  {view.contact?.email && <span className="resume-template__meta-item">✉️ {view.contact.email}</span>}
                </div>
              )}
            </div>
            {view.summary && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Summary</p>
                <div className="resume-template__content">{view.summary}</div>
              </div>
            )}
            {hasExperience && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Experience</p>
                {experiences.map((exp, idx) => (
                  <div className="resume-template__entry" key={`exp-${idx}`}>
                    <div className="resume-template__entry-header">
                      <div className="resume-template__entry-title">{exp.jobTitle}</div>
                      <div className="resume-template__entry-date">{exp.startDate}{exp.startDate && exp.endDate ? ' — ' : ''}{exp.endDate}</div>
                    </div>
                    <div className="resume-template__entry-meta">{exp.employer}{exp.city ? ` • ${exp.city}` : ''}{exp.state ? `, ${exp.state}` : ''}</div>
                    <div className="resume-template__content">{exp.duties}</div>
                  </div>
                ))}
              </div>
            )}
            {hasEducation && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Education</p>
                {educations.map((edu, idx) => (
                  <div className="resume-template__entry" key={`edu-${idx}`}>
                    <div className="resume-template__entry-header">
                      <div className="resume-template__entry-title">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                      <div className="resume-template__entry-date">{edu.startDate}{edu.startDate && edu.endDate ? ' — ' : ''}{edu.endDate}</div>
                    </div>
                    <div className="resume-template__entry-meta">{edu.schoolName}{edu.city ? ` • ${edu.city}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
            {(view.certifications || []).length > 0 && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Certifications</p>
                {(view.certifications || []).map((cert, index) => (
                  <div key={`${cert.name}-${index}`} className="resume-template__entry">
                    <div className="resume-template__entry-title">{cert.name}</div>
                    {cert.issuer && <div className="resume-template__entry-meta">{cert.issuer}{cert.year ? ` • ${cert.year}` : ''}</div>}
                  </div>
                ))}
              </div>
            )}
            {(view.projects || []).length > 0 && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Projects</p>
                {(view.projects || []).map((project, index) => (
                  <div key={`${project.title || 'project'}-${index}`} className="resume-template__entry">
                    <div className="resume-template__entry-title">{project.title}</div>
                    <div className="resume-template__content">{project.description}</div>
                  </div>
                ))}
              </div>
            )}
            <AdditionalInfoSections sections={view.additionalInfo} />
          </div>
        </div>
      </div>
    </div>
  );
};
