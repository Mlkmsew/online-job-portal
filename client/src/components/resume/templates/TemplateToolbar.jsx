import { FiSliders } from 'react-icons/fi';
import TemplateFilter from './TemplateFilter';
import TemplateSearch from './TemplateSearch';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'ats', label: 'ATS Score' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const TemplateToolbar = ({ searchValue, onSearchChange, activeFilter, onFilterChange, sortValue, onSortChange, resultCount }) => {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-1 flex-col gap-3 xl:max-w-2xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <FiSliders className="h-4 w-4" />
          <span>Filter and refine templates</span>
        </div>
        <TemplateFilter activeFilter={activeFilter} onChange={onFilterChange} />
      </div>

      <div className="flex flex-col gap-3 lg:min-w-[320px] lg:flex-row lg:items-center lg:justify-end">
        <div className="w-full lg:w-72">
          <TemplateSearch value={searchValue} onChange={onSearchChange} />
        </div>
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          <span className="font-medium">Sort</span>
          <select value={sortValue} onChange={onSortChange} aria-label="Sort resume templates" className="bg-transparent outline-none">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="text-sm font-medium text-slate-500">{resultCount} templates</div>
    </div>
  );
};

export default TemplateToolbar;
