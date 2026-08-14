import { CheckCircle2, FileText, Mail, Plus, Star, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

const recommendations = ['Strongly Recommend', 'Recommend', 'Neutral', 'Not Recommended'];
const decisions = ['Passed', 'Rejected', 'Next Round'];

const InterviewEvaluation = ({ interview, form, onChange, onSaveDraft, onSubmit, onBack }) => {
  const [strengthInput, setStrengthInput] = useState('');
  const [improvementInput, setImprovementInput] = useState('');
  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);

  const ratingText = useMemo(() => {
    if (!form.rating || Number(form.rating) === 0) return '0 / 5';
    return `${form.rating} / 5`;
  }, [form.rating]);

  const addStrength = () => {
    if (!strengthInput.trim()) return;
    setStrengths((prev) => [...prev, strengthInput.trim()]);
    setStrengthInput('');
  };

  const addImprovement = () => {
    if (!improvementInput.trim()) return;
    setImprovements((prev) => [...prev, improvementInput.trim()]);
    setImprovementInput('');
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Finish Interview</h2>
          <p className="mt-1 text-sm text-slate-600">Capture final feedback and hiring recommendation.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onSaveDraft} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Save as Draft</button>
          <button type="button" onClick={onSubmit} className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white">Submit Feedback</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><UserCheck className="h-4 w-4" /> Candidate Summary</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">Candidate</p>
            <p className="mt-1 font-semibold text-slate-900">{`${interview?.applicant?.firstName || ''} ${interview?.applicant?.lastName || ''}`.trim() || 'Candidate'}</p>
            <p className="mt-2 text-sm text-slate-600">{interview?.job?.title || 'Applied position'}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {interview?.applicant?.email || 'Email pending'}</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> {interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleString() : 'Date pending'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Overall Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => onChange({ ...form, rating: star })} className={Number(form.rating) >= star ? 'text-amber-500' : 'text-slate-300'}>
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-slate-600">{ratingText}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Recommendation</label>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((option) => (
                <button key={option} type="button" onClick={() => onChange({ ...form, recommendation: option })} className={`rounded-full px-3 py-2 text-sm ${form.recommendation === option ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Strengths</label>
            <div className="flex flex-wrap gap-2">
              {strengths.map((item) => <span key={item} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{item}</span>)}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={strengthInput} onChange={(event) => setStrengthInput(event.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="Add strength" />
              <button type="button" onClick={addStrength} className="rounded-full border border-slate-200 px-3 py-2 text-sm">+ Add Strength</button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Areas of Improvement</label>
            <div className="flex flex-wrap gap-2">
              {improvements.map((item) => <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">{item}</span>)}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={improvementInput} onChange={(event) => setImprovementInput(event.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="Add improvement" />
              <button type="button" onClick={addImprovement} className="rounded-full border border-slate-200 px-3 py-2 text-sm">+ Add Improvement</button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Final Decision</label>
            <select value={form.finalDecision} onChange={(event) => onChange({ ...form, finalDecision: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none">
              <option value="">Select decision</option>
              {decisions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Additional Notes</label>
            <textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} rows="5" maxLength={1000} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" placeholder="Share final observations and next steps" />
            <p className="mt-2 text-sm text-slate-500">{(form.notes || '').length} / 1000</p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back</button>
            <button type="button" onClick={onSubmit} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Submit Feedback</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewEvaluation;
