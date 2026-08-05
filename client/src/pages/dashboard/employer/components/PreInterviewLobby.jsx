import { CalendarDays, Camera, CheckCircle2, Clock3, Mail, Mic, PhoneOff, ShieldCheck, UserCheck, Video } from 'lucide-react';
import { useMemo, useState } from 'react';

const agendaItems = [
  { title: 'Introduction', duration: '10 min', summary: 'Warm-up and role overview.' },
  { title: 'Technical Assessment', duration: '30 min', summary: 'Deep-dive into core technical skills.' },
  { title: 'Problem Solving', duration: '15 min', summary: 'Scenario-based discussion.' },
  { title: 'Q&A', duration: '5 min', summary: 'Candidate questions and wrap-up.' },
];

const checklistItems = [
  'Audio and video test complete',
  'Candidate resume checked',
  'Internet stability confirmed',
];

const PreInterviewLobby = ({ interview, onReschedule, onStartInterview, onBack }) => {
  const [activeAgenda, setActiveAgenda] = useState('Introduction');

  const candidateName = useMemo(() => {
    const parts = [`${interview?.applicant?.firstName || ''}`.trim(), `${interview?.applicant?.lastName || ''}`.trim()].filter(Boolean);
    return parts.join(' ') || 'Candidate';
  }, [interview]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Start Interview</h2>
          <p className="mt-1 text-sm text-slate-600">Prepare the interview room before you begin.</p>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Pre-Interview Lobby</div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Candidate Overview</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{candidateName}</h3>
                <p className="mt-2 text-sm text-slate-600">{interview?.job?.title || 'Applied position'}</p>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">Ready</div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Mail className="h-4 w-4" /> Contact</div>
                <p className="mt-2 text-sm text-slate-700">{interview?.applicant?.email || 'Email pending'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><CalendarDays className="h-4 w-4" /> Schedule</div>
                <p className="mt-2 text-sm text-slate-700">{interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleString() : 'To be scheduled'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Video className="h-4 w-4" /> Meeting Link</div>
                <p className="mt-2 text-sm text-slate-700">{interview?.meetingLink || interview?.location || 'To be confirmed'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><ShieldCheck className="h-4 w-4" /> Interviewer</div>
                <p className="mt-2 text-sm text-slate-700">{interview?.employer?.firstName ? `${interview.employer.firstName} ${interview.employer.lastName || ''}`.trim() : 'Recruiter Team'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Interview Agenda</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">Interactive Timeline</span>
            </div>
            <div className="mt-4 space-y-3">
              {agendaItems.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveAgenda(item.title)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${activeAgenda === item.title ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{item.duration}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Before You Start</h3>
            <div className="mt-4 space-y-3">
              {checklistItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Clock3 className="h-4 w-4" /> Session Details</div>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2"><span>Duration</span><span>60 min</span></div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2"><span>Type</span><span>{interview?.type || 'Video'}</span></div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2"><span>Meeting ID</span><span>482-319</span></div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2"><span>Passcode</span><span>JH74</span></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onReschedule} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Reschedule</button>
            <button type="button" onClick={onStartInterview} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Start Interview</button>
            <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Back</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreInterviewLobby;
