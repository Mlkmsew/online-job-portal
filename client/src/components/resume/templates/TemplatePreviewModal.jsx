import { FiCheck, FiX } from 'react-icons/fi';

const TemplatePreviewModal = ({ template, resume, accentColor, onSelect, onClose, selected }) => {
  if (!template) return null;

  const TemplateComponent = template.component;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl lg:flex-row">
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
            <TemplateComponent resume={resume} color={accentColor} />
          </div>
        </div>

        <div className="w-full max-w-md border-t border-slate-200 bg-white p-6 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Template Preview</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Close preview">
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between"><span>ATS score</span><span className="font-semibold text-slate-900">{template.atsScore}</span></div>
            <div className="flex items-center justify-between"><span>Columns</span><span className="font-semibold text-slate-900">{template.columns}</span></div>
            <div className="flex items-center justify-between"><span>Best for</span><span className="font-semibold text-slate-900">{template.bestFor}</span></div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Color options</h4>
            <div className="mt-3 flex gap-2">
              {['blue', 'green', 'purple', 'slate'].map((option) => (
                <button key={option} type="button" className="h-9 w-9 rounded-full border border-slate-200 bg-white shadow-sm transition hover:scale-105" style={{ backgroundColor: option === 'blue' ? '#2563eb' : option === 'green' ? '#10b981' : option === 'purple' ? '#7c3aed' : '#334155' }} aria-label={`Use ${option} accent`} />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Font options</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Inter', 'Manrope', 'Source Sans'].map((font) => (
                <span key={font} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
                  {font}
                </span>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => onSelect(template.id)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {selected ? <><FiCheck className="h-4 w-4" /> Currently Selected</> : 'Select Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
