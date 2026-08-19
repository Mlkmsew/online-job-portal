import './shared.css';
import { getColorTokens, getInitials, getResumeViewModel } from './templateUtils';
import AdditionalInfoSections from './AdditionalInfoSections';

export const Minimal = ({ resume, color = 'black', compact = false }) => {
  const view = getResumeViewModel(resume);
  const initials = getInitials(view.fullName);
  const tokens = getColorTokens(color);
  const style = { '--accent': tokens.accent, '--accent-soft': tokens.accentSoft, '--accent-contrast': tokens.accentContrast, '--surface': '#ffffff', '--surface-alt': '#fafafa' };

  const experiences = Array.isArray(view.experiences) ? view.experiences : (view.experience ? [view.experience] : []);
  const educations = Array.isArray(view.educations) ? view.educations : (view.education ? [view.education] : []);
  const hasContact = view.contact?.email || view.contact?.phone || view.contact?.location || view.contact?.linkedin;

  return (
    <div className={`resume-template-shell ${compact ? 'resume-template--compact' : ''}`}>
      <div className={`resume-template ${compact ? 'resume-template--compact' : ''}`} style={style}>
        <div style={{ padding: '34px 32px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff' }}>
          
          {/* Top Header: Name & Photo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#000000', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {view.fullName}
              </h1>
              {view.profession && (
                <p style={{ fontSize: '13px', color: '#4b5563', margin: '4px 0 0 0', fontWeight: '500' }}>
                  {view.profession}
                </p>
              )}
            </div>
            <div>
              {view.photo ? (
                <img src={view.photo} alt="Profile" style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: Personal Details */}
          {hasContact && (
            <div>
              <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '10px' }}>
                Personal Details
              </div>
              <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {view.contact?.location && <div>{view.contact.location}</div>}
                <div>
                  {view.contact?.email && <span>{view.contact.email}</span>}
                  {view.contact?.email && view.contact?.phone && <span>, </span>}
                  {view.contact?.phone && <span>{view.contact.phone}</span>}
                </div>
                {view.contact?.linkedin && <div>LinkedIn: {view.contact.linkedin}</div>}
              </div>
            </div>
          )}

          {/* SECTION: Profile */}
          {view.summary && (
            <div>
              <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '10px' }}>
                Profile
              </div>
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                {view.summary}
              </p>
            </div>
          )}

          {/* SECTION: Employment */}
          {experiences.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '14px' }}>
                Employment
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {experiences.map((exp, idx) => (
                  <div key={`exp-${idx}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                        {exp.jobTitle || exp.title}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>
                        {exp.startDate || ''} {exp.endDate ? `- ${exp.endDate}` : (exp.current ? '- Present' : '')}
                      </div>
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
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Education */}
          {educations.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '14px' }}>
                Education
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {educations.map((edu, idx) => (
                  <div key={`edu-${idx}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                        {edu.degree || edu.studyType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>
                        {edu.startDate || ''} {edu.endDate ? `- ${edu.endDate}` : ''}
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600' }}>
                      {edu.schoolName || edu.institution} {edu.city ? `, ${edu.city}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Skills */}
          {view.skills && view.skills.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '10px' }}>
                Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {view.skills.map((skill, index) => (
                  <span key={`${skill.name || 'skill'}-${index}`} style={{ backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', color: '#1f2937' }}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* SECTION: Certifications */}
          {(view.certifications || []).length > 0 && (
            <div>
              <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '14px' }}>
                Certifications
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {view.certifications.map((cert, idx) => (
                  <div key={`cert-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                      {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}
                    </div>
                    {cert.year && <div style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563' }}>{cert.year}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

        <AdditionalInfoSections sections={view.additionalInfo} style={{ marginTop: '6px' }} />

        </div>
      </div>
    </div>
  );
};

export default Minimal;