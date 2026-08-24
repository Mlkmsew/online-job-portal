import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Circular = ({ resume, color = 'blue', compact = false }) => {
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
  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location || view.contact?.linkedin;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '100%', position: 'relative' }}>
          
          {/* Left Sidebar with Dark/Accent Header & Footer curve effect */}
          <div style={{ backgroundColor: tokens.accent, color: '#ffffff', padding: '24px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Top Header / Name inside Sidebar */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 15px 0', lineHeight: '1.3' }}>
                  {view.fullName}
                </h2>
                
                {/* Large Circular Profile Photo */}
                {view.photo ? (
                  <img 
                    src={view.photo} 
                    alt="Profile" 
                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.8)', margin: '0 auto' }} 
                  />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto', color: '#ffffff' }}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Personal Details */}
              {hasContact && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Personal details
                  </p>

                  {view.fullName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '11px' }}>
                      <span>👤</span>
                      <span style={{ fontWeight: '500' }}>{view.fullName}</span>
                    </div>
                  )}

                  {view.contact?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '11px', wordBreak: 'break-all' }}>
                      <span>✉</span>
                      <span>{view.contact.email}</span>
                    </div>
                  )}

                  {view.contact?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '11px' }}>
                      <span>📞</span>
                      <span>{view.contact.phone}</span>
                    </div>
                  )}

                  {view.contact?.location && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', fontSize: '11px' }}>
                      <span>📍</span>
                      <span>{view.contact.location}</span>
                    </div>
                  )}

                  {view.contact?.linkedin && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', fontSize: '11px', wordBreak: 'break-all' }}>
                      <span>🔗</span>
                      <span>{view.contact.linkedin}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Languages
                  </p>
                  {languages.map((lang, idx) => (
                    <div key={`lang-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11px' }}>
                      <span>{typeof lang === 'string' ? lang : lang.name}</span>
                      <span style={{ fontSize: '10px', opacity: 0.9, letterSpacing: '2px' }}>★★★★★</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Skills
                  </p>
                  {skills.map((skill, idx) => (
                    <div key={`${skill.name}-${idx}`} style={{ fontSize: '11px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
                      <span>{skill.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Qualities */}
              {softSkills.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Qualities
                  </p>
                  {softSkills.map((qual, idx) => (
                    <div key={`qual-${idx}`} style={{ fontSize: '11px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
                      <span>{typeof qual === 'string' ? qual : qual.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hobbies */}
              {hobbies.length > 0 && (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Hobbies
                  </p>
                  {hobbies.map((hobby, idx) => (
                    <div key={`hobby-${idx}`} style={{ fontSize: '11px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
                      <span>{typeof hobby === 'string' ? hobby : hobby.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Main Content Area */}
          <div style={{ padding: '25px', backgroundColor: '#ffffff' }}>
            
            {/* Profile / Summary */}
            {view.summary && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px', letterSpacing: '0.5px' }}>
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
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Employment
                </h2>
                
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
                ))}
              </div>
            )}

            {/* Education Section */}
            {educations.length > 0 && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.5px' }}>
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
                    
                    <div style={{ fontSize: '12px', color: tokens.accent, fontWeight: '500' }}>
                      {edu.schoolName || edu.institution} {edu.city ? `, ${edu.city}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects Section */}
            {projects.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Projects
                </h2>
                {projects.map((project, idx) => (
                  <div key={`${project.title || 'project'}-${idx}`} style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{project.title}</div>
                    {project.description && (
                      <p style={{ fontSize: '11px', color: '#374151', lineHeight: '1.4', margin: '4px 0 0 0' }}>{project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* Certifications Section */}
            {(view.certifications || []).length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Certifications
                </h2>
                {view.certifications.map((cert, idx) => (
                  <div key={`cert-${idx}`} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{cert.name}</div>
                      {cert.year && <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>{cert.year}</div>}
                    </div>
                    {cert.issuer && <div style={{ fontSize: '12px', color: tokens.accent, fontWeight: '500' }}>{cert.issuer}</div>}
                  </div>
                ))}
              </div>
            )}

          <AdditionalInfoSections
            sections={view.additionalInfo}
            style={{ marginTop: '16px' }}
          />

          </div>

        </div>
      </div>
    </div>
  );
};

export default Circular;