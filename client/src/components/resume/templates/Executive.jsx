import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';

export const Executive = ({ resume, color = 'purple', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = {
    '--accent': tokens.accent,
    '--accent-soft': tokens.accentSoft,
    '--surface': '#ffffff'
  };

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
            <div className="professional-sidebar__group">
              <p className="professional-heading">Contact</p>
              {view.contact?.email && <div className="professional-sidebar__item">{view.contact.email}</div>}
              {view.contact?.phone && <div className="professional-sidebar__item">{view.contact.phone}</div>}
              {view.contact?.location && <div className="professional-sidebar__item">{view.contact.location}</div>}
            </div>
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
              <p className="resume-template__profession">{view.profession}</p>
            </div>
            <div className="professional-section">
              <p className="resume-template__eyebrow">Summary</p>
              <div className="resume-template__content">{view.summary}</div>
            </div>
            <div className="professional-section">
              <p className="resume-template__eyebrow">Experience</p>
              <div className="experience-entry">
                <div className="experience-title-row">
                  <div>
                    <div className="experience-title">{view.experience.jobTitle}</div>
                    <div className="experience-company">{view.experience.employer}</div>
                  </div>
                  <div className="experience-date">{view.experience.startDate} — {view.experience.endDate}</div>
                </div>
                <div className="experience-bullets">
                  <li>{view.experience.duties}</li>
                </div>
              </div>
            </div>
            <div className="professional-section">
              <p className="resume-template__eyebrow">Education</p>
              <div className="education-entry">
                <div className="experience-title-row">
                  <div>
                    <div className="education-degree">{view.education.degree} in {view.education.fieldOfStudy}</div>
                    <div className="education-school">{view.education.schoolName}</div>
                  </div>
                  <div className="experience-date">{view.education.startDate} — {view.education.endDate}</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Executive;
