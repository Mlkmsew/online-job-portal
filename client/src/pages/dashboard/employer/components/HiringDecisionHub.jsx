import { CheckCircle2, Download, Mail, UserPlus } from 'lucide-react';

const actions = [
  { title: 'Move to Hired', description: 'Advance the candidate to the hired stage.' },
  { title: 'Send Offer', description: 'Email the candidate with an offer package.' },
  { title: 'Add to Talent Pool', description: 'Keep the profile available for future roles.' },
  { title: 'Download Report', description: 'Export a PDF summary for the hiring team.' },
];

const HiringDecisionHub = ({ interview, onBack }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-3xl border border-[#A8C8F5] bg-[#EAF2FE] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">All Interviews Completed!</h2>
            <p className="mt-1 text-sm text-slate-600">Finalize the candidate decision and next steps.</p>
          </div>
          <div className="rounded-full border border-[#7FB0F0] bg-white px-3 py-1 text-sm font-medium text-[#0A4FA8]">Hiring Decision Hub</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <button key={action.title} type="button" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              {action.title === 'Move to Hired' && <CheckCircle2 className="h-4 w-4 text-[#0D5BC4]" />}
              {action.title === 'Send Offer' && <Mail className="h-4 w-4 text-sky-600" />}
              {action.title === 'Add to Talent Pool' && <UserPlus className="h-4 w-4 text-violet-600" />}
              {action.title === 'Download Report' && <Download className="h-4 w-4 text-amber-600" />}
              {action.title}
            </div>
            <p className="mt-2 text-sm text-slate-600">{action.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back to Interviews</button>
      </div>
    </div>
  );
};

export default HiringDecisionHub;
