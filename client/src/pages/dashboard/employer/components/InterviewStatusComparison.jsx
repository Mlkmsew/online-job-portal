import { CheckCircle2, CircleOff, Star, XCircle } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getCandidateName = (interview) => {
  const fullName = [interview?.applicant?.firstName, interview?.applicant?.lastName].filter(Boolean).join(' ');
  return fullName || 'Candidate';
};

const getStatusLabel = (status) => {
  const normalized = `${status || ''}`.toLowerCase();
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
  return 'Scheduled';
};

const getDecision = (interview) => {
  const decision = interview?.finalDecision || interview?.result || interview?.feedback || '';
  if (!decision) return 'Pending';
  return `${decision}`;
};

const getReason = (interview) => {
  const reason = interview?.note || interview?.feedback || '';
  if (!reason) return 'Reschedule needed';
  return `${reason}`;
};

const InterviewStatusComparison = ({ interviews = [] }) => {
  const completedInterviews = interviews.filter((interview) => `${interview?.status || ''}`.toLowerCase() === 'completed');
  const cancelledInterviews = interviews.filter((interview) => ['cancelled', 'canceled'].includes(`${interview?.status || ''}`.toLowerCase()));

  const completedRows = completedInterviews.slice(0, 4).map((interview) => ({
    candidate: getCandidateName(interview),
    position: interview?.job?.title || 'Open role',
    date: formatDate(interview?.scheduledDate),
    status: getStatusLabel(interview?.status),
    decision: getDecision(interview),
  }));

  const cancelledRows = cancelledInterviews.slice(0, 4).map((interview) => ({
    candidate: getCandidateName(interview),
    position: interview?.job?.title || 'Open role',
    date: formatDate(interview?.scheduledDate),
    reason: getReason(interview),
    cancelledBy: interview?.note?.includes('candidate') ? 'Candidate' : 'Employer',
  }));

  const renderTable = (rows, columns, renderRow) => (
    <div className="overflow-hidden rounded-[16px] border border-slate-200">
      <div className="grid grid-cols-[1.4fr_1fr_0.9fr_0.8fr] bg-slate-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      <div className="divide-y divide-slate-200 bg-white">
        {rows.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-500">No matching interviews yet.</div>
        ) : (
          rows.map((row, index) => renderRow(row, index))
        )}
      </div>
    </div>
  );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Completed Interviews</h2>
              <p className="mt-1 text-sm text-slate-600">These interviews were successfully conducted and concluded with an evaluation.</p>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-emerald-200 bg-white/80 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Includes</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                'Interviews that were conducted',
                'Interviews that were completed and rated',
                'Interviews with interviewer feedback',
                'Hiring decisions recorded',
                'Candidate status updated',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {renderTable(
              completedRows,
              ['Candidate', 'Position', 'Date', 'Status'],
              (row) => (
                <div key={`${row.candidate}-${row.date}`} className="grid grid-cols-[1.4fr_1fr_0.9fr_0.8fr] items-center gap-2 px-3 py-3 text-sm text-slate-700">
                  <div className="font-medium text-slate-900">{row.candidate}</div>
                  <div>{row.position}</div>
                  <div>{row.date}</div>
                  <div>
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {row.status}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-sm font-semibold text-emerald-800">Why it matters</p>
            <p className="mt-1 text-sm text-emerald-700">Completed interviews help recruiters evaluate candidates, review feedback, compare scores, and move hiring decisions forward.</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
              <XCircle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Cancelled Interviews</h2>
              <p className="mt-1 text-sm text-slate-600">These interviews were scheduled but did not take place and need follow-up.</p>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-rose-200 bg-white/80 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Includes</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                'Cancelled by employer',
                'Cancelled by candidate',
                'Scheduling conflicts',
                'Emergency cancellation',
                'Reschedule required',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {renderTable(
              cancelledRows,
              ['Candidate', 'Position', 'Date', 'Reason'],
              (row) => (
                <div key={`${row.candidate}-${row.date}`} className="grid grid-cols-[1.4fr_1fr_0.9fr_1.1fr] items-center gap-2 px-3 py-3 text-sm text-slate-700">
                  <div className="font-medium text-slate-900">{row.candidate}</div>
                  <div>{row.position}</div>
                  <div>{row.date}</div>
                  <div>
                    <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                      {row.reason}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50/70 p-4">
            <p className="text-sm font-semibold text-rose-800">Why it matters</p>
            <p className="mt-1 text-sm text-rose-700">Cancelled interviews help maintain schedule accuracy, reduce confusion, and support smoother rescheduling workflows.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Summary</p>
            <p className="text-sm text-blue-700">Completed interviews happened successfully, while cancelled interviews did not occur. Both statuses help recruiters manage hiring professionally.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InterviewStatusComparison;
