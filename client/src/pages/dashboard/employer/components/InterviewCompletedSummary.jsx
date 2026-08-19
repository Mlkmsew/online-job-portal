import { CheckCircle2, Download, Mail, UserPlus, UserRoundCheck } from 'lucide-react';

const InterviewCompletedSummary = ({ interview, evaluation, onViewProfile, onBack, onShareFeedback, onNextStage }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-3xl border border-[#A8C8F5] bg-[#EAF2FE] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Interview Completed!</h2>
            <p className="mt-1 text-sm text-slate-600">The interview record and feedback have been finalized.</p>
          </div>
          <div className="rounded-full border border-[#7FB0F0] bg-white px-3 py-1 text-sm font-medium text-[#0A4FA8]">Completed</div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium text-slate-900">{`${interview?.applicant?.firstName || ''} ${interview?.applicant?.lastName || ''}`.trim() || 'Candidate'}</td>
              <td className="px-4 py-3 text-slate-700">{interview?.job?.title || 'Applied position'}</td>
              <td className="px-4 py-3 text-slate-700">{interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : 'Pending'}</td>
              <td className="px-4 py-3 text-slate-700">60 mins</td>
              <td className="px-4 py-3 text-slate-700">{evaluation?.rating ? `${evaluation.rating}/5` : 'Pending'}</td>
              <td className="px-4 py-3 text-slate-700">{evaluation?.finalDecision || 'Pending'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onViewProfile} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">View Candidate Profile</button>
        <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back to Interviews</button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <button type="button" onClick={onShareFeedback} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Mail className="h-4 w-4" /> Share feedback with team</div>
        </button>
        <button type="button" onClick={onNextStage} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><UserPlus className="h-4 w-4" /> Move candidate to next stage</div>
        </button>
      </div>
    </div>
  );
};

export default InterviewCompletedSummary;
