import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';

export const Classic = ({ resume, color = 'green', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--accent-contrast': tokens.accentContrast, '--surface': '#fefefe', '--surface-alt': '#f8fafc' };

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
            <div className="resume-template__meta" style={{ gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {view.contact?.email && <span className="resume-template__meta-item">{view.contact.email}</span>}
              {view.contact?.phone && <span className="resume-template__meta-item">{view.contact.phone}</span>}
              {view.contact?.location && <span className="resume-template__meta-item">{view.contact.location}</span>}
            </div>
          </div>
          <div className="resume-template__section">
            <p className="resume-template__eyebrow">Profile</p>
            <div className="resume-template__content">{view.summary}</div>
          </div>
          <div className="resume-template__section">
            <p className="resume-template__eyebrow">Experience</p>
            <div className="resume-template__entry">
              <div className="resume-template__entry-header">
                <div className="resume-template__entry-title">{view.experience?.jobTitle} — {view.experience?.employer}</div>
                <div className="resume-template__entry-date">{view.experience?.startDate} — {view.experience?.endDate}</div>
              </div>
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
              <div className="resume-template__entry-meta">{view.education?.schoolName}, {view.education?.city}</div>
            </div>
          </div>
          <div className="resume-template__section">
            <p className="resume-template__eyebrow">Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(view.skills || []).map((skill, index) => (
                <span key={`${skill.name || 'skill'}-${index}`} className="resume-template__pill">{skill.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classic;
