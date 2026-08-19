import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Classic = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--accent-contrast': tokens.accentContrast, '--surface': '#fefefe', '--surface-alt': '#f8fafc' };

  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location;
  const hasSkills = (view.skills || []).filter((skill) => skill?.name).length > 0;
  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasExperience = experiences.length > 0;
  const hasEducation = educations.length > 0;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ padding: '34px 32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', borderBottom: '2px solid var(--accent)', paddingBottom: '12px' }}>
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
            {hasContact && (
              <div className="resume-template__meta" style={{ gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {view.contact?.email && <span className="resume-template__meta-item">{view.contact.email}</span>}
                {view.contact?.phone && <span className="resume-template__meta-item">{view.contact.phone}</span>}
                {view.contact?.location && <span className="resume-template__meta-item">{view.contact.location}</span>}
              </div>
            )}
          </div>
          {view.summary && (
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Profile</p>
              <div className="resume-template__content">{view.summary}</div>
            </div>
          )}
          {hasExperience && (
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Experience</p>
              {experiences.map((exp, idx) => (
                <div className="resume-template__entry" key={`exp-${idx}`}>
                  <div className="resume-template__entry-header">
                    <div className="resume-template__entry-title">{exp.jobTitle}{exp.employer ? ` — ${exp.employer}` : ''}</div>
                    <div className="resume-template__entry-date">{exp.startDate}{exp.startDate && exp.endDate ? ' — ' : ''}{exp.endDate}</div>
                  </div>
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
                  <div className="resume-template__entry-meta">{edu.schoolName}{edu.city ? `, ${edu.city}` : ''}</div>
                </div>
              ))}
            </div>
          )}
          {(view.certifications || []).length > 0 && (
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Certifications</p>
              {(view.certifications || []).map((cert, index) => (
                <div key={`${cert.name}-${index}`} className="resume-template__entry">
                  <div className="resume-template__entry-header">
                    <div className="resume-template__entry-title">{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</div>
                    {cert.year && <div className="resume-template__entry-date">{cert.year}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasSkills && (
            <div className="resume-template__section">
              <p className="resume-template__eyebrow">Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(view.skills || []).filter((skill) => skill?.name).map((skill, index) => (
                  <span key={`${skill.name || 'skill'}-${index}`} className="resume-template__pill">{skill.name}</span>
                ))}
              </div>
            </div>
          )}
          <AdditionalInfoSections sections={view.additionalInfo} />
        </div>
      </div>
    </div>
  );
};

export default Classic;
