import { FiSearch } from 'react-icons/fi';

const TemplateSearch = ({ value, onChange, placeholder = 'Search templates' }) => {
  return (
    <label className="relative block">
      <span className="sr-only">Search resume templates</span>
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label="Search resume templates"
        className="w-full rounded-full border border-slate-200 bg-white py-2.75 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
};

export default TemplateSearch;
