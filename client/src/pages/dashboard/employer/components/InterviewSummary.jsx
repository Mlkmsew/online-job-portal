import { CheckCircle2, FileText, Star } from 'lucide-react';

const InterviewSummary = ({ interview, evaluation, onViewProfile, onBack, onShare, onNextStage }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Interview Completed</h2>
          <p className="mt-1 text-sm text-slate-600">The interview feedback has been recorded successfully.</p>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Success</div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Interview Completed</h3>
            <p className="text-sm text-slate-600">Candidate: {`${interview?.applicant?.firstName || ''} ${interview?.applicant?.lastName || ''}`.trim()}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">Position</p>
            <p className="mt-1 font-semibold text-slate-900">{interview?.job?.title || 'Applied position'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">Decision</p>
            <p className="mt-1 font-semibold text-slate-900">{evaluation?.finalDecision || 'Pending'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">Rating</p>
            <p className="mt-1 font-semibold text-slate-900">{evaluation?.rating ? `${evaluation.rating}/5` : 'Pending'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">Recommendation</p>
            <p className="mt-1 font-semibold text-slate-900">{evaluation?.recommendation || 'Pending'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onViewProfile} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">View Candidate Profile</button>
        <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back to Interviews</button>
        <button type="button" onClick={onShare} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Share Feedback</button>
        <button type="button" onClick={onNextStage} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Move Candidate to Next Stage</button>
      </div>
    </div>
  );
};

export default InterviewSummary;
