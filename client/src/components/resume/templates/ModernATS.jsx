import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';

export const ModernATS = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--accent-contrast': tokens.accentContrast, '--surface': '#ffffff', '--surface-alt': '#f8fafc' };

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
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Contact</p>
              {view.contact?.email && <div className="resume-template__content">{view.contact.email}</div>}
              {view.contact?.phone && <div className="resume-template__content">{view.contact.phone}</div>}
              {view.contact?.location && <div className="resume-template__content">{view.contact.location}</div>}
            </div>
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(view.skills || []).filter((skill) => skill?.name).map((skill, index) => (
                  <span key={`${skill.name}-${index}`} className="resume-template__pill">{skill.name}</span>
                ))}
              </div>
            </div>
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
              <div className="resume-template__meta">
                <span className="resume-template__meta-item">📍 {view.contact?.location}</span>
                <span className="resume-template__meta-item">✉️ {view.contact?.email}</span>
              </div>
            </div>
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Summary</p>
              <div className="resume-template__content">{view.summary}</div>
            </div>
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Experience</p>
              <div className="resume-template__entry">
                <div className="resume-template__entry-header">
                  <div className="resume-template__entry-title">{view.experience?.jobTitle}</div>
                  <div className="resume-template__entry-date">{view.experience?.startDate} — {view.experience?.endDate}</div>
                </div>
                <div className="resume-template__entry-meta">{view.experience?.employer} • {view.experience?.city}, {view.experience?.state}</div>
                <div className="resume-template__content">{view.experience?.duties}</div>
              </div>
            </div>
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Education</p>
              <div className="resume-template__entry">
                <div className="resume-template__entry-header">
                  <div className="resume-template__entry-title">{view.education?.degree} in {view.education?.fieldOfStudy}</div>
                  <div className="resume-template__entry-date">{view.education?.startDate} — {view.education?.endDate}</div>
                </div>
                <div className="resume-template__entry-meta">{view.education?.schoolName} • {view.education?.city}, {view.education?.state}</div>
              </div>
            </div>
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Projects</p>
              {(view.projects || []).map((project, index) => (
                <div key={`${project.title || 'project'}-${index}`} className="resume-template__entry">
                  <div className="resume-template__entry-title">{project.title}</div>
                  <div className="resume-template__content">{project.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
