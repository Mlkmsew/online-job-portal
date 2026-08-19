import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Chrono = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--surface': '#ffffff' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const languages = Array.isArray(view.languages) ? view.languages : [];

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        
        {/* Top Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
          <div>
            <h1 className="resume-template__name" style={{ fontSize: '28px', fontWeight: 'bold', color: tokens.accent, margin: 0 }}>
              {view.fullName}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#4b5563' }}>
              {view.contact?.email && <span>✉ {view.contact.email}</span>}
              {view.contact?.phone && <span>📞 {view.contact.phone}</span>}
              {view.contact?.location && <span>📍 {view.contact.location}</span>}
              {view.contact?.linkedin && <span>🔗 {view.contact.linkedin}</span>}
            </div>
            {view.summary && (
              <p style={{ marginTop: '12px', fontSize: '12px', lineHeight: '1.5', color: '#374151', maxWidth: '600px' }}>
                {view.summary}
              </p>
            )}
          </div>

          {view.photo && (
            <img 
              src={view.photo} 
              alt="Profile" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${tokens.accent}` }} 
            />
          )}
        </div>

        {/* Timeline Body Section */}
        <div className="chrono-body">
          <div className="chrono-timeline">

            {/* Employment Section Header */}
            {experiences.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p className="resume-template__eyebrow" style={{ color: tokens.accent, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
                  Employment
                </p>
              </div>
            )}

            {/* Employment Loop */}
            {experiences.map((exp, idx) => (
              <div key={`exp-${idx}`} className="chrono-timeline__item" style={{ display: 'flex', gap: '20px', marginBottom: '20px', position: 'relative' }}>
                {/* Left Side: Date */}
                <div className="chrono-timeline__date" style={{ width: '130px', flexShrink: 0, fontSize: '12px', fontWeight: '600', color: '#4b5563', textAlign: 'right' }}>
                  {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                </div>

                {/* Middle: Timeline Marker & Line */}
                <div className="chrono-timeline__marker" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <span className="chrono-timeline__dot" style={{ width: '10px', height: '10px', backgroundColor: tokens.accent, borderRadius: '50%', zIndex: 2, marginTop: '3px' }} />
                  <span className="chrono-timeline__line" style={{ width: '2px', backgroundColor: '#e5e7eb', flexGrow: 1, position: 'absolute', top: '13px', bottom: '-20px' }} />
                </div>

                {/* Right Side: Content */}
                <div className="chrono-timeline__content" style={{ flexGrow: 1, paddingBottom: '10px' }}>
                  <div className="resume-template__entry-title" style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>
                    {exp.jobTitle || exp.title}
                  </div>
                  <div className="resume-template__entry-meta" style={{ fontSize: '12px', color: tokens.accent, fontWeight: '500', marginBottom: '6px' }}>
                    {exp.employer || exp.company} {exp.city ? `• ${exp.city}` : ''}
                  </div>
                  {(exp.duties || exp.description) && (
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
                      {typeof exp.duties === 'string' ? (
                        <p style={{ margin: 0 }}>{exp.duties}</p>
                      ) : (
                        exp.duties
                      )}
                      {exp.description && <p style={{ margin: 0 }}>{exp.description}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Education Section Header */}
            {educations.length > 0 && (
              <div style={{ marginTop: '24px', marginBottom: '12px' }}>
                <p className="resume-template__eyebrow" style={{ color: tokens.accent, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
                  Education
                </p>
              </div>
            )}

            {/* Education Loop */}
            {educations.map((edu, idx) => (
              <div key={`edu-${idx}`} className="chrono-timeline__item" style={{ display: 'flex', gap: '20px', marginBottom: '20px', position: 'relative' }}>
                <div className="chrono-timeline__date" style={{ width: '130px', flexShrink: 0, fontSize: '12px', fontWeight: '600', color: '#4b5563', textAlign: 'right' }}>
                  {edu.startDate || ''} {edu.endDate ? `- ${edu.endDate}` : ''}
                </div>

                <div className="chrono-timeline__marker" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <span className="chrono-timeline__dot" style={{ width: '10px', height: '10px', backgroundColor: tokens.accent, borderRadius: '50%', zIndex: 2, marginTop: '3px' }} />
                  <span className="chrono-timeline__line" style={{ width: '2px', backgroundColor: '#e5e7eb', flexGrow: 1, position: 'absolute', top: '13px', bottom: '-20px' }} />
                </div>

                <div className="chrono-timeline__content" style={{ flexGrow: 1, paddingBottom: '10px' }}>
                  <div className="resume-template__entry-title" style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>
                    {edu.degree || edu.studyType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                  </div>
                  <div className="resume-template__entry-meta" style={{ fontSize: '12px', color: tokens.accent, fontWeight: '500' }}>
                    {edu.schoolName || edu.institution} {edu.city ? `• ${edu.city}` : ''}
                  </div>
                </div>
              </div>
            ))}

            {/* Languages Section */}
            {languages.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <p className="resume-template__eyebrow" style={{ color: tokens.accent, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', marginBottom: '10px' }}>
                  Languages
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {languages.map((lang, idx) => (
                    <span key={`lang-${idx}`} style={{ backgroundColor: tokens.accentSoft, color: tokens.accent, padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                      {typeof lang === 'string' ? lang : lang.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Certifications Section */}
            {(view.certifications || []).length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <p className="resume-template__eyebrow" style={{ color: tokens.accent, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', marginBottom: '10px' }}>
                  Certifications
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {view.certifications.map((cert, idx) => (
                    <div key={`cert-${idx}`} style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', width: '130px', flexShrink: 0 }}>{cert.year}</span>
                      <span style={{ fontSize: '12px', color: '#111827', fontWeight: '500' }}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AdditionalInfoSections
              sections={view.additionalInfo}
              style={{ marginTop: '24px' }}
            />

          </div>
        </div>

      </div>
    </div>
  );
};

export default Chrono;