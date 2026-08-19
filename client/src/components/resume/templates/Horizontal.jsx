import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Horizontal = ({ resume, color = 'blue', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--surface': '#ffffff' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location || view.contact?.linkedin;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', backgroundColor: '#ffffff' }}>
          
          {/* Top Header: Full Name */}
          <div style={{ padding: '24px 30px 15px 30px', borderBottom: '2px solid #e5e7eb' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.accent, margin: 0, letterSpacing: '0.5px' }}>
              {view.fullName}
            </h1>
          </div>

          {/* Main Body Layout: Two Columns (Sidebar Left, Content Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', flex: 1 }}>
            
            {/* Left Sidebar: Photo & Personal Details */}
            <div style={{ backgroundColor: '#f8fafc', padding: '24px 20px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Photo */}
              <div style={{ textAlign: 'center' }}>
                {view.photo ? (
                  <img src={view.photo} alt="Profile" style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d5db', margin: '0 auto' }} />
                ) : (
                  <div style={{ width: '130px', height: '130px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', color: '#4b5563', margin: '0 auto', borderRadius: '4px' }}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Personal Details Section */}
              {hasContact && (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #d1d5db', paddingBottom: '5px', marginBottom: '12px', letterSpacing: '0.5px' }}>
                    Personal details
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                    {view.fullName && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '2px' }}>Name</div>
                        <div style={{ color: '#111827' }}>{view.fullName}</div>
                      </div>
                    )}

                    {view.contact?.email && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '2px' }}>Email address</div>
                        <div style={{ color: '#111827', wordBreak: 'break-all' }}>{view.contact.email}</div>
                      </div>
                    )}

                    {view.contact?.phone && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '2px' }}>Phone number</div>
                        <div style={{ color: '#111827' }}>{view.contact.phone}</div>
                      </div>
                    )}

                    {view.contact?.location && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '2px' }}>Address</div>
                        <div style={{ color: '#111827', lineHeight: '1.4' }}>{view.contact.location}</div>
                      </div>
                    )}

                    {view.contact?.linkedin && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '2px' }}>LinkedIn</div>
                        <div style={{ color: '#111827', wordBreak: 'break-all' }}>{view.contact.linkedin}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Right Content Area: Profile, Employment, Education */}
            <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Profile / Summary */}
              {view.summary && (
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px', letterSpacing: '0.5px' }}>
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
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Employment
                  </h2>

                  {experiences.map((exp, idx) => (
                    <div key={`exp-${idx}`} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                          {exp.jobTitle || exp.title}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: tokens.accent }}>
                          {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '6px' }}>
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
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Education
                  </h2>

                  {educations.map((edu, idx) => (
                    <div key={`edu-${idx}`} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                          {edu.degree || edu.studyType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: tokens.accent }}>
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

            {/* Certifications */}
              {(view.certifications || []).length > 0 && (
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', color: tokens.accent, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Certifications
                  </h2>
                  {view.certifications.map((cert, idx) => (
                    <div key={`cert-${idx}`} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{cert.name}</div>
                        {cert.year && <div style={{ fontSize: '11px', fontWeight: '600', color: tokens.accent }}>{cert.year}</div>}
                      </div>
                      {cert.issuer && <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{cert.issuer}</div>}
                    </div>
                  ))}
                </div>
              )}

            <AdditionalInfoSections
              sections={view.additionalInfo}
              style={{ marginTop: '18px' }}
            />

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Horizontal;