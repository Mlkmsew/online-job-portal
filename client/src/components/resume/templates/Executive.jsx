import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Executive = ({ resume, color = 'purple', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = {
    '--accent': tokens.accent,
    '--accent-soft': tokens.accentSoft,
    '--surface': '#ffffff'
  };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location;
  const hasExperience = experiences.length > 0;
  const hasEducation = educations.length > 0;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div className="professional-layout">
          <aside className="professional-sidebar">
            <div className="professional-photo">
              {view.photo ? (
                <img src={view.photo} alt="Profile" className="professional-photo" />
              ) : (
                <div className="professional-photo--placeholder">{initials}</div>
              )}
            </div>
            {hasContact && (
              <div className="professional-sidebar__group">
                <p className="professional-heading">Contact</p>
                {view.contact?.email && <div className="professional-sidebar__item">{view.contact.email}</div>}
                {view.contact?.phone && <div className="professional-sidebar__item">{view.contact.phone}</div>}
                {view.contact?.location && <div className="professional-sidebar__item">{view.contact.location}</div>}
              </div>
            )}
            {view.skills.length > 0 && (
              <div className="professional-sidebar__group">
                <p className="professional-heading">Skills</p>
                <div className="professional-chip-list">
                  {view.skills.slice(0, 6).map((skill, index) => (
                    <span key={`${skill.name}-${index}`} className="professional-chip">{skill.name}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <main className="professional-main">
            <div className="professional-header">
              <h1 className="resume-template__name">{view.fullName}</h1>
              {view.profession && <p className="resume-template__profession">{view.profession}</p>}
            </div>
            {view.summary && (
              <div className="professional-section">
                <p className="resume-template__eyebrow">Summary</p>
                <div className="resume-template__content">{view.summary}</div>
              </div>
            )}
            {hasExperience && (
              <div className="professional-section">
                <p className="resume-template__eyebrow">Experience</p>
                {experiences.map((exp, idx) => (
                  <div className="experience-entry" key={`exp-${idx}`}>
                    <div className="experience-title-row">
                      <div>
                        {exp.jobTitle && <div className="experience-title">{exp.jobTitle}</div>}
                        {exp.employer && <div className="experience-company">{exp.employer}</div>}
                      </div>
                      <div className="experience-date">{exp.startDate}{exp.startDate && exp.endDate ? ' — ' : ''}{exp.endDate}</div>
                    </div>
                    {exp.duties && (
                      <div className="experience-bullets">
                        <li>{exp.duties}</li>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hasEducation && (
              <div className="professional-section">
                <p className="resume-template__eyebrow">Education</p>
                {educations.map((edu, idx) => (
                  <div className="education-entry" key={`edu-${idx}`}>
                    <div className="experience-title-row">
                      <div>
                        {(edu.degree || edu.fieldOfStudy) && <div className="education-degree">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>}
                        {edu.schoolName && <div className="education-school">{edu.schoolName}</div>}
                      </div>
                      <div className="experience-date">{edu.startDate}{edu.startDate && edu.endDate ? ' — ' : ''}{edu.endDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {(view.certifications || []).length > 0 && (
              <div className="professional-section">
                <p className="resume-template__eyebrow">Certifications</p>
                {(view.certifications || []).map((cert, index) => (
                  <div key={`${cert.name}-${index}`} className="resume-template__entry">
                    <div className="resume-template__entry-title">{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</div>
                    {cert.year && <div className="resume-template__entry-meta">{cert.year}</div>}
                  </div>
                ))}
              </div>
            )}
          <AdditionalInfoSections sections={view.additionalInfo} style={{ marginTop: '16px' }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Executive;
