import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';

export const Casual = ({ resume, color = 'green', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--surface': '#ffffff' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.education) ? view.education : (view.education ? [view.education] : []);
  const languages = Array.isArray(view.languages) ? view.languages : [];
  const qualities = Array.isArray(view.qualities) ? view.qualities : [];

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100%' }}>
          
          {/* Left Sidebar */}
          <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '24px 20px' }}>
            {/* Profile Photo */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {view.photo ? (
                <img 
                  src={view.photo} 
                  alt="Profile" 
                  style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.8)', margin: '0 auto 12px auto' }} 
                />
              ) : (
                <div className="resume-template__profile-initials" style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 12px auto' }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Personal Details Section */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '1px' }}>
                Personal details
              </p>
              
              {view.fullName && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>Name</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{view.fullName}</div>
                </div>
              )}

              {view.contact?.email && (
                <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>Email address</div>
                  <div style={{ fontSize: '12px' }}>{view.contact.email}</div>
                </div>
              )}

              {view.contact?.phone && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>Phone number</div>
                  <div style={{ fontSize: '12px' }}>{view.contact.phone}</div>
                </div>
              )}

              {view.contact?.location && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>Address</div>
                  <div style={{ fontSize: '12px' }}>{view.contact.location}</div>
                </div>
              )}

              {view.contact?.linkedin && (
                <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>LinkedIn</div>
                  <div style={{ fontSize: '12px' }}>{view.contact.linkedin}</div>
                </div>
              )}
            </div>

            {/* Languages Section */}
            {languages.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '1px' }}>
                  Languages
                </p>
                {languages.map((lang, idx) => (
                  <div key={`lang-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                    <span>{typeof lang === 'string' ? lang : lang.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.9 }}>★★★★★</span>
                  </div>
                ))}
              </div>
            )}

            {/* Qualities / Skills Section */}
            {qualities.length > 0 && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '1px' }}>
                  Qualities
                </p>
                {qualities.map((qual, idx) => (
                  <div key={`qual-${idx}`} style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
                    <span>{typeof qual === 'string' ? qual : qual.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Content Area */}
          <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
            
            {/* Top Name & Profession */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
              <h1 className="resume-template__name" style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {view.fullName}
              </h1>
              {view.profession && (
                <p className="resume-template__profession" style={{ fontSize: '14px', color: tokens.accent, fontWeight: '600', marginTop: '4px' }}>
                  {view.profession}
                </p>
              )}
            </div>

            {/* Profile / Summary */}
            {view.summary && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  Profile
                </h2>
                <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                  {view.summary}
                </p>
              </div>
            )}

            {/* Employment Section */}
            {experiences.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Employment
                </h2>
                
                {experiences.map((exp, idx) => (
                  <div key={`exp-${idx}`} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '15px', marginBottom: '16px' }}>
                    {/* Date */}
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', paddingTop: '2px' }}>
                      {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                    </div>

                    {/* Job Details */}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                        {exp.jobTitle || exp.title}
                      </div>
                      <div style={{ fontSize: '12px', color: tokens.accent, fontWeight: '500', marginBottom: '4px' }}>
                        {exp.employer || exp.company} {exp.city ? `, ${exp.city}` : ''}
                      </div>
                      {(exp.duties || exp.description) && (
                        <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.4' }}>
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
              </div>
            )}

            {/* Education Section */}
            {educations.length > 0 && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Education
                </h2>

                {educations.map((edu, idx) => (
                  <div key={`edu-${idx}`} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '15px', marginBottom: '14px' }}>
                    {/* Date */}
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', paddingTop: '2px' }}>
                      {edu.startDate || ''} {edu.endDate ? `- ${edu.endDate}` : ''}
                    </div>

                    {/* Education Details */}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                        {edu.degree || edu.studyType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: tokens.accent, fontWeight: '500' }}>
                        {edu.schoolName || edu.institution} {edu.city ? `, ${edu.city}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default Casual;