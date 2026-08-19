// ============================================
// AdditionalInfoSections - Shared renderer for
// custom CV sections (Awards, Volunteer, Publications,
// References, Memberships, Achievements, Hobbies, Custom)
// -------------------------------------------------
// Rendered by every resume template so custom sections
// added through the Resume Builder "Add Section" flow
// appear in the live preview and downloaded PDF.
// Sections without data render nothing.
// ============================================
import './shared.css';

const normalizeItem = (item) => {
  if (typeof item === 'string') return { title: '', description: item };
  return {
    title: item?.title || item?.name || '',
    description: item?.description || item?.detail || '',
  };
};

const AdditionalInfoSections = ({ sections = [], style }) => {
  const meaningful = (Array.isArray(sections) ? sections : [])
    .filter((section) => section && section.title)
    .map((section) => ({
      ...section,
      items: (Array.isArray(section.items) ? section.items : [])
        .filter(Boolean)
        .map(normalizeItem)
        .filter((item) => item.title || item.description),
    }))
    .filter((section) => section.items.length > 0);

  if (meaningful.length === 0) return null;

  return (
    <div style={style}>
      {meaningful.map((section) => (
        <div key={section.key || section.title} className="resume-template__section">
          <p className="resume-template__eyebrow">{section.title}</p>
          {section.items.map((item, index) => (
            <div key={`${section.key || section.title}-${index}`} className="resume-template__entry">
              {item.title && <div className="resume-template__entry-title">{item.title}</div>}
              {item.description && <div className="resume-template__content">{item.description}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AdditionalInfoSections;
