import { CheckCircle2, Clock3, FileText, Star } from 'lucide-react';

const FinishInterview = ({ interview, form, onChange, onSaveDraft, onSubmit, onBack }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Finish Interview</h2>
          <p className="mt-1 text-sm text-slate-600">Capture the final evaluation for this interview round.</p>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">Interview Summary</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Candidate Summary</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div><span className="font-medium">Candidate:</span> {`${interview?.applicant?.firstName || ''} ${interview?.applicant?.lastName || ''}`.trim()}</div>
            <div><span className="font-medium">Position:</span> {interview?.job?.title || 'Applied position'}</div>
            <div><span className="font-medium">Interview Date:</span> {interview?.scheduledDate || 'Not scheduled'}</div>
            <div><span className="font-medium">Duration:</span> 45 mins</div>
            <div><span className="font-medium">Type:</span> {interview?.type || 'In Person'}</div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Overall Rating</label>
            <select
              value={form.rating}
              onChange={(event) => onChange({ ...form, rating: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Select rating</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Recommendation</label>
            <select
              value={form.recommendation}
              onChange={(event) => onChange({ ...form, recommendation: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Select recommendation</option>
              <option value="Strongly Recommend">Strongly Recommend</option>
              <option value="Recommend">Recommend</option>
              <option value="Neutral">Neutral</option>
              <option value="Not Recommended">Not Recommended</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Final Decision</label>
            <select
              value={form.finalDecision}
              onChange={(event) => onChange({ ...form, finalDecision: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Select decision</option>
              <option value="Passed">Passed</option>
              <option value="Rejected">Rejected</option>
              <option value="Hired">Hired</option>
              <option value="Move to Final Round">Move to Final Round</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Strengths</label>
            <input
              type="text"
              value={form.strengths}
              onChange={(event) => onChange({ ...form, strengths: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Strong communication, React expertise"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Areas of Improvement</label>
            <input
              type="text"
              value={form.weaknesses}
              onChange={(event) => onChange({ ...form, weaknesses: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Needs more depth in testing"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(event) => onChange({ ...form, notes: event.target.value })}
              rows="4"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Additional interviewer notes"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onSaveDraft} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Save Draft</button>
            <button type="button" onClick={onSubmit} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Submit Feedback</button>
            <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinishInterview;
