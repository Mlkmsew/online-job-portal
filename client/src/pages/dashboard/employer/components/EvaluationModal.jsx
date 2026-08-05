import { Award, Star, ThumbsDown, ThumbsUp } from 'lucide-react';

const EvaluationModal = ({ interview, form, onChange, onSave, onClose }) => {
  if (!interview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Complete Assessment</h3>
            <p className="mt-1 text-sm text-slate-600">Capture evaluation notes, rating, strengths, weaknesses, and final decision.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500">Close</button>
        </div>

        <form onSubmit={onSave} className="mt-6 space-y-4">
          <div>
            <label htmlFor="assessment-notes" className="mb-2 block text-sm font-medium text-slate-700">Interview Notes</label>
            <textarea
              id="assessment-notes"
              value={form.notes}
              onChange={(event) => onChange({ ...form, notes: event.target.value })}
              rows="4"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Add detailed recruiter feedback"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Candidate Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => onChange({ ...form, rating: starValue })}
                  className={`rounded-full p-1 ${form.rating >= starValue ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-600">{form.rating ? `${form.rating}/5` : 'Select a rating'}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="strengths" className="mb-2 block text-sm font-medium text-slate-700">Strengths</label>
              <input
                id="strengths"
                type="text"
                value={form.strengths}
                onChange={(event) => onChange({ ...form, strengths: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Strong React skills, communication"
              />
            </div>
            <div>
              <label htmlFor="weaknesses" className="mb-2 block text-sm font-medium text-slate-700">Weaknesses</label>
              <input
                id="weaknesses"
                type="text"
                value={form.weaknesses}
                onChange={(event) => onChange({ ...form, weaknesses: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Needs more testing depth"
              />
            </div>
          </div>

          <div>
            <label htmlFor="recommendation" className="mb-2 block text-sm font-medium text-slate-700">Recommendation</label>
            <select
              id="recommendation"
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
            <label htmlFor="final-decision" className="mb-2 block text-sm font-medium text-slate-700">Mark Final Decision</label>
            <select
              id="final-decision"
              value={form.finalDecision}
              onChange={(event) => onChange({ ...form, finalDecision: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value="Pending Evaluation">Pending Evaluation</option>
              <option value="Passed">Passed</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
              <option value="Move to Final Round">Move to Final Round</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Save Evaluation</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationModal;
