import './shared.css';
import { getColorTokens, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Luxe = ({ resume, color = 'indigo', compact = false }) => {
  const view = getResumeViewModel(resume);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--surface': '#ffffff' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location || view.contact?.linkedin || view.photo;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff' }}>
          
          {/* Top Header Layout: Small colored box on left, Large Name on right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Top Left Accent Box */}
            <div style={{ width: '80px', height: '65px', backgroundColor: tokens.accent, display: 'flex', alignItems: 'flex-end', padding: '6px', borderRadius: '2px' }}>
              <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resume
              </span>
            </div>

            {/* Top Right Full Name */}
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '300', color: tokens.accent, margin: 0, letterSpacing: '0.5px' }}>
                {view.fullName}
              </h1>
            </div>
          </div>

          {/* SECTION 1: Personal details */}
          {hasContact && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '12px' }}>
                Personal details
              </h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', flex: 1 }}>
                  {view.fullName && (
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                      <span style={{ fontWeight: 'bold', color: tokens.accent }}>Name</span>
                      <span style={{ color: '#111827' }}>{view.fullName}</span>
                    </div>
                  )}
                  {view.contact?.email && (
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                      <span style={{ fontWeight: 'bold', color: tokens.accent }}>Email address</span>
                      <span style={{ color: '#111827', wordBreak: 'break-all' }}>{view.contact.email}</span>
                    </div>
                  )}
                  {view.contact?.phone && (
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                      <span style={{ fontWeight: 'bold', color: tokens.accent }}>Phone number</span>
                      <span style={{ color: '#111827' }}>{view.contact.phone}</span>
                    </div>
                  )}
                  {view.contact?.location && (
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                      <span style={{ fontWeight: 'bold', color: tokens.accent }}>Address</span>
                      <span style={{ color: '#111827' }}>{view.contact.location}</span>
                    </div>
                  )}
                  {view.contact?.linkedin && (
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                      <span style={{ fontWeight: 'bold', color: tokens.accent }}>LinkedIn</span>
                      <span style={{ color: '#111827', wordBreak: 'break-all' }}>{view.contact.linkedin}</span>
                    </div>
                  )}
                </div>

                {/* Profile Photo */}
                {view.photo && (
                  <div style={{ marginLeft: '20px' }}>
                    <img src={view.photo} alt="Profile" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '2px' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: Profile */}
          {view.summary && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '8px' }}>
                Profile
              </h2>
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                {view.summary}
              </p>
            </div>
          )}

          {/* SECTION 3: Employment */}
          {experiences.length > 0 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '14px' }}>
                Employment
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {experiences.map((exp, idx) => (
                  <div key={`exp-${idx}`} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '15px' }}>
                    {/* Left: Date */}
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: tokens.accent, paddingTop: '2px' }}>
                      {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                    </div>

                    {/* Right: Job Details */}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                        {exp.jobTitle || exp.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600', marginBottom: '4px' }}>
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
            </div>
          )}

          {/* SECTION 4: Education */}
          {educations.length > 0 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '14px' }}>
                Education
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {educations.map((edu, idx) => (
                  <div key={`edu-${idx}`} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '15px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: tokens.accent, paddingTop: '2px' }}>
                      {edu.startDate || ''} {edu.endDate ? `- ${edu.endDate}` : ''}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                        {edu.degree || edu.studyType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600' }}>
                        {edu.schoolName || edu.institution} {edu.city ? `, ${edu.city}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* SECTION 5: Certifications */}
          {(view.certifications || []).length > 0 && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '12px' }}>
                Certifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {view.certifications.map((cert, idx) => (
                  <div key={`cert-${idx}`} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '15px' }}>
                    {cert.year ? (
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: tokens.accent }}>{cert.year}</div>
                    ) : (
                      <div></div>
                    )}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{cert.name}</div>
                      {cert.issuer && <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600' }}>{cert.issuer}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        <AdditionalInfoSections
            sections={view.additionalInfo}
            style={{ marginTop: '18px' }}
          />

        </div>
      </div>
    </div>
  );
};

export default Luxe;