import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Elegant = ({ resume, color = 'purple', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--surface': '#ffffff' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const languages = Array.isArray(view.languages) ? view.languages : [];
  const softSkills = (Array.isArray(view.softSkills) ? view.softSkills : []).map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean);
  const hobbies = String(view.interests || '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  const skills = (Array.isArray(view.skills) ? view.skills : []).filter((skill) => skill?.name);
  const projects = Array.isArray(view.projects) ? view.projects.filter(Boolean) : [];

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100%', backgroundColor: '#ffffff' }}>
          
          {/* Left Dark Sidebar */}
          <div style={{ backgroundColor: '#2d3748', color: '#ffffff', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Languages */}
            {languages.length > 0 && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Languages
                </p>
                {languages.map((lang, idx) => (
                  <div key={`lang-${idx}`} style={{ marginBottom: '10px', fontSize: '11px' }}>
                    <div style={{ marginBottom: '4px' }}>{typeof lang === 'string' ? lang : lang.name}</div>
                    <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: '85%', height: '100%', backgroundColor: tokens.accent }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Qualities */}
            {softSkills.length > 0 && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Qualities
                </p>
                {softSkills.map((qual, idx) => (
                  <div key={`qual-${idx}`} style={{ fontSize: '11px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: tokens.accent, display: 'inline-block' }}></span>
                    <span>{typeof qual === 'string' ? qual : qual.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Hobbies */}
            {hobbies.length > 0 && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Hobbies
                </p>
                {hobbies.map((hobby, idx) => (
                  <div key={`hobby-${idx}`} style={{ fontSize: '11px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: tokens.accent, display: 'inline-block' }}></span>
                    <span>{typeof hobby === 'string' ? hobby : hobby.name}</span>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Right Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Header Banner with Accent Color */}
            <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '24px 30px', display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Circular Profile Photo */}
              <div>
                {view.photo ? (
                  <img src={view.photo} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.8)' }} />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold', color: '#ffffff' }}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Name & Contact Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>
                  {view.fullName}
                </h1>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', marginTop: '6px', opacity: 0.95 }}>
                  {view.contact?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✉</span><span>{view.contact.email}</span>
                    </div>
                  )}
                  {view.contact?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📞</span><span>{view.contact.phone}</span>
                    </div>
                  )}
                  {view.contact?.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📍</span><span>{view.contact.location}</span>
                    </div>
                  )}
                  {view.contact?.linkedin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔗</span><span style={{ wordBreak: 'break-all' }}>{view.contact.linkedin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile / Summary */}
              {view.summary && (
                <div>
                  <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '8px' }}>
                    Profile
                  </div>
                  <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                    {view.summary}
                  </p>
                </div>
              )}

              {/* Employment */}
              {experiences.length > 0 && (
                <div>
                  <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>
                    Employment
                  </div>

                  {experiences.map((exp, idx) => (
                    <div key={`exp-${idx}`} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                          {exp.jobTitle || exp.title}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>
                          {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>
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
                  ))}
                </div>
              )}

              {/* Education */}
              {educations.length > 0 && (
                <div>
                  <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>
                    Education
                  </div>

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

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>
                  Projects
                </div>
                {projects.map((project, idx) => (
                  <div key={`${project.title || 'project'}-${idx}`} style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                      {project.title}
                    </div>
                    {project.description && (
                      <p style={{ fontSize: '11px', color: '#374151', lineHeight: '1.4', margin: '4px 0 0 0' }}>{project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '10px' }}>
                  Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map((skill, idx) => (
                    <span key={`${skill.name}-${idx}`} style={{ backgroundColor: tokens.accentSoft, color: tokens.accent, padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
              {(view.certifications || []).length > 0 && (
                <div>
                  <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>
                    Certifications
                  </div>
                  {view.certifications.map((cert, idx) => (
                    <div key={`cert-${idx}`} style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827' }}>
                        {cert.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                        {cert.issuer}{cert.issuer && cert.year ? ' • ' : ''}{cert.year}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            <AdditionalInfoSections
              sections={view.additionalInfo}
              style={{ marginTop: '14px' }}
            />

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Elegant;