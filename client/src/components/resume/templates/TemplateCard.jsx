import { FiCheck, FiEye, FiStar } from 'react-icons/fi';
import TemplateBadge from './TemplateBadge';

const TemplateCard = ({ template, selected, resume, accentColor, onSelect, onPreview, component: TemplateComponent }) => {
  return (
    <article className={`w-[240px] md:w-[260px] flex-none overflow-hidden group rounded-[20px] border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl ${selected ? 'border-[#1769E0] ring-2 ring-blue-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TemplateBadge tone={template.badge === 'Premium' ? 'premium' : 'free'}>{template.badge}</TemplateBadge>
          {template.atsReady && <TemplateBadge tone="neutral">ATS Ready</TemplateBadge>}
        </div>
        {selected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
            <FiCheck className="h-3.5 w-3.5" /> Selected
          </span>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50 p-2.5">
        <div
          className="overflow-hidden rounded-[12px] bg-white template-card-preview"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '15px',
          }}
        >
          <TemplateComponent resume={resume} color={accentColor} compact />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{template.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {template.formats.map((format) => (
          <span key={format} className="rounded-full border border-slate-200 px-2.5 py-1">
            {format}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onSelect(template.id)}
          className="flex-1 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {selected ? 'Currently Selected' : 'Use Template'}
        </button>
        <button
          type="button"
          onClick={() => onPreview(template.id)}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          aria-label={`Preview ${template.name}`}
        >
          <FiEye className="mr-2 h-4 w-4" /> Preview
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <FiStar className="h-4 w-4 text-sky-500" />
        <span>Premium layout with polished structure and ATS clarity.</span>
      </div>
    </article>
  );
};

export default TemplateCard;
