import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';

export const Professional = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = {
    '--accent': tokens.accent,
    '--accent-soft': tokens.accentSoft,
    '--accent-contrast': tokens.accentContrast,
    '--surface': '#ffffff',
    '--surface-alt': '#f8fafc'
  };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.education) ? view.education : (view.education ? [view.education] : []);
  const languages = Array.isArray(view.languages) ? view.languages : [];
  const qualities = Array.isArray(view.qualities) ? view.qualities : [];
  const hobbies = Array.isArray(view.hobbies) ? view.hobbies : (Array.isArray(view.interests) ? view.interests : []);

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', backgroundColor: '#ffffff' }}>
          
          {/* Top Dark Header Banner */}
          <div style={{ backgroundColor: '#2d3748', color: '#ffffff', padding: '24px 30px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Profile Photo / Initials */}
            <div>
              {view.photo ? (
                <img src={view.photo} alt="Profile" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.3)' }} />
              ) : (
                <div style={{ width: '90px', height: '90px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#ffffff', borderRadius: '4px' }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Name, Profession & Contact Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
                {view.fullName}
              </h1>
              {view.profession && (
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>
                  {view.profession}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>
                {view.contact?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>✉</span><span>{view.contact.email}</span>
                  </div>
                )}
                {view.contact?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📞</span><span>{view.contact.phone}</span>
                  </div>
                )}
                {view.contact?.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📍</span><span>{view.contact.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Body Grid: Left Content (Profile, Employment, Education), Right Sidebar (Personal details, Languages, Qualities, Hobbies) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', flex: 1 }}>
            
            {/* Left Content Area */}
            <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '22px', borderRight: '1px solid #e5e7eb' }}>
              
              {/* Profile */}
              {view.summary && (
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Profile
                  </h2>
                  <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                    {view.summary}
                  </p>
                </div>
              )}

              {/* Employment */}
              {experiences.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Employment
                  </h2>

                  {experiences.map((exp, idx) => {
                    const dutyItems = typeof exp.duties === 'string' 
                      ? exp.duties.split('\n').map(i => i.trim()).filter(Boolean)
                      : (Array.isArray(exp.duties) ? exp.duties : []);

                    return (
                      <div key={`exp-${idx}`} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                            {exp.jobTitle || exp.title}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>
                            {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '6px' }}>
                          {exp.employer || exp.company} {exp.city ? `, ${exp.city}` : ''}
                        </div>

                        {dutyItems.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.4' }}>
                            {dutyItems.map((duty, dIdx) => (
                              <li key={`duty-${dIdx}`} style={{ marginBottom: '3px' }}>{duty}</li>
                            ))}
                          </ul>
                        )}
                        {exp.description && (
                          <p style={{ fontSize: '11px', color: '#374151', lineHeight: '1.4', margin: 0 }}>{exp.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Education */}
              {educations.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Education
                  </h2>

                  {educations.map((edu, idx) => (
                    <div key={`edu-${idx}`} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                          {edu.degree || edu.studyType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>
                          {edu.startDate || ''} {edu.endDate ? `- ${edu.endDate}` : ''}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                        {edu.schoolName || edu.institution} {edu.city ? `, ${edu.city}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Right Sidebar Area */}
            <div style={{ padding: '24px 20px', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Personal Details */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  Personal details
                </h3>
                {view.contact?.linkedin && (
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>LinkedIn</div>
                    <div style={{ color: '#111827', wordBreak: 'break-all' }}>{view.contact.linkedin}</div>
                  </div>
                )}
              </div>

              {/* Languages */}
              {languages.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Languages
                  </h3>
                  {languages.map((lang, idx) => (
                    <div key={`lang-${idx}`} style={{ marginBottom: '10px', fontSize: '11px' }}>
                      <div style={{ marginBottom: '4px', color: '#111827' }}>{typeof lang === 'string' ? lang : lang.name}</div>
                      <div style={{ height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', backgroundColor: '#2d3748' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Qualities */}
              {qualities.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Qualities
                  </h3>
                  {qualities.map((qual, idx) => (
                    <div key={`qual-${idx}`} style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: '#2d3748', display: 'inline-block' }}></span>
                      <span>{typeof qual === 'string' ? qual : qual.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hobbies */}
              {hobbies.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Hobbies
                  </h3>
                  {hobbies.map((hobby, idx) => (
                    <div key={`hobby-${idx}`} style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: '#2d3748', display: 'inline-block' }}></span>
                      <span>{typeof hobby === 'string' ? hobby : hobby.name}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Professional;