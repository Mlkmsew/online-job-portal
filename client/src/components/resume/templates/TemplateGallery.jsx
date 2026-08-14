import { useMemo, useState, useRef, useEffect } from 'react';
import { FiCheck, FiEye, FiSearch } from 'react-icons/fi';
import { getTemplateDefinitions } from './config';
import { getColorTokens } from './templateUtils';

const DEFAULT_COLOR = 'blue';

const TemplateGallery = ({ selectedTemplateId, onSelectTemplate, onPreviewTemplate, resume }) => {
  const templates = useMemo(() => getTemplateDefinitions(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);

  const filtered = useMemo(() => templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) || template.description.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery, templates]);

  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Only intercept when horizontal scrolling is possible
      if (el.scrollWidth <= el.clientWidth) return;

      // If vertical scroll attempted, translate to horizontal scroll and prevent page scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Resume Builder</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose a premium resume template</h2>
          <p className="mt-2 text-sm text-slate-600">Every layout is a real, printable resume with a polished gallery experience and PDF-ready presentation.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(getColorTokens()).length > 0 && ['blue', 'green', 'purple', 'black', 'teal'].map((color) => {
          const tokens = getColorTokens(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => setActiveColor(color)}
              className={`h-8 w-8 rounded-full border-2 transition ${activeColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: tokens.accent }}
              aria-label={`Select ${tokens.name} accent`}
            />
          );
        })}
      </div>

      <div className="w-full max-w-full overflow-hidden">
        <div
          ref={scrollerRef}
          className="w-full max-w-full overflow-x-auto overflow-y-hidden flex flex-nowrap gap-4 pb-3 template-gallery-scroll"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filtered.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            const TemplateComponent = template.component;

            return (
              <div
                  key={template.id}
                  className={`w-[240px] md:w-[260px] flex-none group rounded-[24px] border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${isSelected ? 'border-emerald-400 shadow-[0_20px_40px_rgba(16,185,129,0.16)]' : 'border-slate-200'}`}
                >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${template.badge === 'Premium' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {template.badge}
                  </span>
                  {template.atsReady && <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">ATS Ready</span>}
                </div>

                <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 p-2">
                  <div className="overflow-hidden rounded-[14px] bg-white">
                    <TemplateComponent resume={resume} color={activeColor} compact />
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{template.description}</p>
                  </div>
                  {isSelected && <div className="rounded-full bg-emerald-100 p-2 text-emerald-700"><FiCheck /></div>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {template.formats.map((format) => <span key={format} className="rounded-full border border-slate-200 px-2.5 py-1">{format}</span>)}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onSelectTemplate(template.id)} className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                    {isSelected ? 'Currently Selected' : 'Use Template'}
                  </button>
                  <button type="button" onClick={() => onPreviewTemplate(template.id)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#1769E0] hover:bg-[#EAF2FE]">
                    <span className="inline-flex items-center gap-2"><FiEye /> Preview</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
