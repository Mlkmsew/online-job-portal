import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Creative = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--accent-contrast': tokens.accentContrast, '--surface': '#ffffff', '--surface-alt': '#fef7f0' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasContact = view.contact?.email || view.contact?.phone;
  const hasSkills = (view.skills || []).filter((skill) => skill?.name).length > 0;
  const hasExperience = experiences.length > 0;
  const hasEducation = educations.length > 0;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', minHeight: '100%' }}>
          <div style={{ background: 'linear-gradient(180deg, var(--accent) 0%, #1f2937 100%)', color: '#fff', padding: '28px 24px' }}>
            <div className="resume-template__section">
              <div className="resume-template__profile">
                {view.photo ? (
                  <img src={view.photo} alt="Profile" className="resume-template__profile-photo" />
                ) : (
                  <div className="resume-template__profile-initials">{initials}</div>
                )}
                <div className="resume-template__profile-info">
                  <p className="resume-template__profile-name" style={{ color: '#fff' }}>{view.fullName}</p>
                  {view.profession && <p className="resume-template__profile-title" style={{ color: 'rgba(255,255,255,0.82)' }}>{view.profession}</p>}
                </div>
              </div>
            </div>
            {hasContact && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow" style={{ color: '#dbeafe' }}>Contact</p>
                {view.contact?.email && <div className="resume-template__content" style={{ color: '#f9fafb' }}>{view.contact.email}</div>}
                {view.contact?.phone && <div className="resume-template__content" style={{ color: '#f9fafb' }}>{view.contact.phone}</div>}
              </div>
            )}
            {hasSkills && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow" style={{ color: '#dbeafe' }}>Highlights</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(view.skills || []).filter((skill) => skill?.name).slice(0, 5).map((skill, index) => (
                    <div key={`${skill.name}-${index}`} className="resume-template__pill" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>{skill.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {view.summary && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Summary</p>
                <div className="resume-template__content">{view.summary}</div>
              </div>
            )}
            {hasExperience && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Selected Work</p>
                {experiences.map((exp, idx) => (
                  <div className="resume-template__entry" key={`exp-${idx}`}>
                    {exp.jobTitle && <div className="resume-template__entry-title">{exp.jobTitle}</div>}
                    {exp.employer && <div className="resume-template__entry-meta">{exp.employer}{exp.city ? ` • ${exp.city}` : ''}</div>}
                    {exp.duties && <div className="resume-template__content">{exp.duties}</div>}
                  </div>
                ))}
              </div>
            )}
            {hasEducation && (
              <div className="resume-template__section">
                <p className="resume-template__eyebrow">Education</p>
                {educations.map((edu, idx) => (
                  <div className="resume-template__entry" key={`edu-${idx}`}>
                    <div className="resume-template__entry-title">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                    <div className="resume-template__entry-meta">{edu.schoolName}{edu.city ? ` • ${edu.city}` : ''}</div>
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
            <AdditionalInfoSections sections={view.additionalInfo} />
          </div>
        </div>
      </div>
    </div>
  );
};
