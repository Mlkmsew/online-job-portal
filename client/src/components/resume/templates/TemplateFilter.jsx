const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ats', label: 'ATS' },
  { id: 'professional', label: 'Professional' },
  { id: 'modern', label: 'Modern' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'creative', label: 'Creative' },
  { id: 'executive', label: 'Executive' },
  { id: 'academic', label: 'Academic' },
];

const TemplateFilter = ({ activeFilter, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            aria-pressed={isActive}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${isActive ? 'border-sky-500 bg-sky-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600'}`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default TemplateFilter;
