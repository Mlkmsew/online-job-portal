import { CheckCircle2, Clock3, FileText, UserCheck } from 'lucide-react';

const rounds = [
  { label: 'Screening', status: 'Passed' },
  { label: 'Technical', status: 'Passed' },
  { label: 'Final Interview', status: 'Pending' },
];

const InterviewRoundProgress = ({ interview, onScheduleLastInterview, onBack }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Next Round</h2>
          <p className="mt-1 text-sm text-slate-600">Track the interview journey and schedule the next round.</p>
        </div>
        <button type="button" onClick={onScheduleLastInterview} className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white">Schedule Last Interview</button>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Clock3 className="h-4 w-4" /> Interview History</div>
        <div className="mt-4 space-y-3">
          {rounds.map((round) => (
            <div key={round.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{round.label}</p>
                <p className="mt-1 text-sm text-slate-600">{interview?.job?.title || 'Applied position'}</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-sm font-medium ${round.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {round.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back</button>
      </div>
    </div>
  );
};

export default InterviewRoundProgress;
