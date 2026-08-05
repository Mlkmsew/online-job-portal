import { Bell, CalendarDays, Clock3, Eye, FileText, Link2, MapPin, SquarePen, Star, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const getInterviewTypeLabel = (type) => {
  if (!type) return 'In Person';
  const normalizedType = (type || '').toLowerCase();
  if (normalizedType.includes('zoom') || normalizedType.includes('meet') || normalizedType.includes('video') || normalizedType.includes('online')) return 'Online';
  if (normalizedType.includes('phone')) return 'Phone';
  if (normalizedType.includes('in-person') || normalizedType.includes('in person')) return 'In Person';
  return type;
};

const formatResultLabel = (value) => {
  if (!value) return 'Pending';
  const normalized = `${value}`.trim().toLowerCase();
  if (['passed', 'pass', 'hired', 'hire', 'accepted'].includes(normalized)) return 'Hired';
  if (['rejected', 'failed', 'fail', 'no hire', 'not selected'].includes(normalized)) return 'Rejected';
  if (['pending', 'pending evaluation', 'review'].includes(normalized)) return 'Pending';
  return value;
};

const getEvaluationStatus = (interview) => {
  const decision = interview?.finalDecision || interview?.recommendation || interview?.result || interview?.feedback || interview?.rating;
  if (decision) {
    const normalized = `${decision}`.trim().toLowerCase();
    if (['hired', 'hire', 'accepted'].includes(normalized)) return 'Hired';
    if (['passed', 'pass', 'move to final round'].includes(normalized)) return 'Passed';
    if (['rejected', 'failed', 'fail', 'not selected'].includes(normalized)) return 'Rejected';
    if (['pending', 'pending evaluation', 'review'].includes(normalized)) return 'Pending Evaluation';
    return interview.finalDecision || formatResultLabel(interview.result);
  }
  return 'Pending Evaluation';
};

const InterviewCard = ({ interview, onViewDetails, onReschedule, onReminder, onCancel, onViewCv, onStartInterview, onUpdateLink, onOpenAssessment, onViewAssessment, onResultChange, resultValue, isCompletedInterview }) => {
  const candidateName = `${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim();
  const statusTone =
    (interview.status || 'scheduled').toLowerCase() === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : (interview.status || 'scheduled').toLowerCase() === 'cancelled' || (interview.status || 'scheduled').toLowerCase() === 'canceled'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-amber-100 text-amber-700';
  const evaluationStatus = getEvaluationStatus(interview);
  const evaluationTone = evaluationStatus === 'Pending Evaluation'
    ? 'bg-slate-100 text-slate-700'
    : evaluationStatus === 'Hired' || evaluationStatus === 'Passed'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
            {interview.applicant?.avatar ? (
              <img src={interview.applicant.avatar} alt="Candidate" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              (interview.applicant?.firstName?.[0] || 'C').toUpperCase()
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{candidateName || 'Candidate'}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusTone}`}>
                {interview.status || 'scheduled'}
              </span>
              {isCompletedInterview && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${evaluationTone}`}>
                  {evaluationStatus}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-sky-700">{interview.job?.title || 'Applied position'}</p>
            <p className="mt-1 text-sm text-slate-600">{interview.company?.name || 'Company'}</p>
          </div>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:min-w-[280px]">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-500" /><span>{format(new Date(interview.scheduledDate), 'MMM d, yyyy')}</span></div>
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-500" /><span>{format(new Date(interview.scheduledDate), 'h:mm a')}</span></div>
          <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-slate-500" /><span>{getInterviewTypeLabel(interview.type)}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /><span>{interview.meetingLink || interview.location || 'To be confirmed'}</span></div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onViewDetails(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <Eye className="h-4 w-4" /> View Details
        </button>
        {!isCompletedInterview && (
          <>
            <button type="button" onClick={() => onReschedule(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <SquarePen className="h-4 w-4" /> Reschedule
            </button>
            <button type="button" onClick={() => onReminder(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Bell className="h-4 w-4" /> Reminder
            </button>
            <button type="button" onClick={() => onCancel(interview)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">
              <XCircle className="h-4 w-4" /> Cancel
            </button>
            <button type="button" onClick={() => onStartInterview(interview)} className="inline-flex items-center gap-2 rounded-full border border-sky-200 px-3 py-2 text-sm text-sky-700 hover:bg-sky-50">
              <Star className="h-4 w-4" /> Start Interview
            </button>
            <button type="button" onClick={() => onUpdateLink(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Link2 className="h-4 w-4" /> Update Link
            </button>
          </>
        )}
        <button type="button" onClick={() => onViewCv(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <FileText className="h-4 w-4" /> View CV
        </button>
        {isCompletedInterview && (
          <>
            <button type="button" onClick={() => onOpenAssessment(interview)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50">
              <Star className="h-4 w-4" /> Complete Assessment
            </button>
            <button type="button" onClick={() => onViewAssessment(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <FileText className="h-4 w-4" /> View Assessment
            </button>
          </>
        )}
        <select
          value={resultValue}
          onChange={(event) => onResultChange(interview._id, event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="Pending">Pending</option>
          <option value="Passed">Passed</option>
          <option value="Rejected">Rejected</option>
          <option value="Hired">Hired</option>
        </select>
      </div>

      {isCompletedInterview && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Star className="h-3.5 w-3.5" /> Rating: {interview.rating ? `${interview.rating}/5` : 'Pending'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <FileText className="h-3.5 w-3.5" /> Notes: {interview.feedback || interview.note ? 'Recorded' : 'Pending'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <ThumbsUp className="h-3.5 w-3.5" /> Strengths: {interview.strengths ? 'Recorded' : 'Pending'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <ThumbsDown className="h-3.5 w-3.5" /> Weaknesses: {interview.weaknesses ? 'Recorded' : 'Pending'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Star className="h-3.5 w-3.5" /> Final Decision: {interview.finalDecision || formatResultLabel(interview.result) || 'Pending Evaluation'}
          </span>
        </div>
      )}
    </div>
  );
};

export default InterviewCard;
