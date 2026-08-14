import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import api from '../../../services/api';

const formatLocationValue = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  const parts = [location.city, location.region, location.address].filter(Boolean);
  return parts.join(', ');
};

const tabs = ['Overview', 'Notes', 'Feedback', 'Files', 'History'];
const defaultAgenda = [
  { label: 'Introduction & Candidate Background', duration: '10 min', completed: true },
  { label: 'Technical Assessment', duration: '30 min', completed: true },
  { label: 'Problem Solving', duration: '15 min', completed: true },
  { label: 'Q&A', duration: '5 min', completed: true },
];
const mockTimeline = [
  { title: 'Application Received', date: 'May 1, 2025', time: '09:00 AM', status: 'Completed' },
  { title: 'Application Reviewed', date: 'May 2, 2025', time: '11:30 AM', status: 'Completed' },
  { title: 'Interview Scheduled', date: 'May 5, 2025', time: '09:00 AM', status: 'Completed' },
  { title: 'Interview Started', date: 'May 5, 2025', time: '10:00 AM', status: 'Completed' },
  { title: 'Interview Completed', date: 'May 5, 2025', time: '10:45 AM', status: 'Completed' },
  { title: 'Final Round', date: 'Pending', time: 'Pending', status: 'Upcoming' },
];
const mockFiles = [
  { name: 'Interview Feedback - John Doe.pdf', size: '2.4 MB', date: 'May 5, 2025' },
  { name: 'Candidate Resume.pdf', size: '1.2 MB', date: 'May 4, 2025' },
];
const mockInterview = {
  _id: 'mock-completed-interview',
  status: 'completed',
  scheduledDate: '2026-08-03T10:00:00.000Z',
  type: 'Video Interview',
  meetingLink: 'https://meet.google.com/demo-link',
  note: 'Strong communicator with thoughtful problem-solving and clear team collaboration.',
  feedback: 'Strong communicator with thoughtful problem-solving and clear team collaboration.',
  rating: 5,
  recommendation: 'Strong Hire',
  strengths: 'Technical Skills, Problem Solving, Communication',
  weaknesses: 'System Design, Time Management',
  finalDecision: 'Move to Next Round',
  applicant: { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', phone: '+251911111111', location: 'Addis Ababa' },
  job: { title: 'Frontend Developer' },
  company: { name: 'EthioSoft' },
  history: [
    { action: 'Interview Scheduled', timestamp: 'May 5, 2025 09:00 AM', performedBy: 'Recruiter Team' },
    { action: 'Reminder Sent', timestamp: 'May 5, 2025 08:30 AM', performedBy: 'Employer' },
    { action: 'Interview Started', timestamp: 'May 5, 2025 10:00 AM', performedBy: 'Employer' },
    { action: 'Interview Completed', timestamp: 'May 5, 2025 10:45 AM', performedBy: 'Employer' },
    { action: 'Feedback Submitted', timestamp: 'May 5, 2025 11:15 AM', performedBy: 'Employer' },
  ],
};

const CompletedInterviewHeader = ({ onBack, title, status, onReschedule, onCancel, onEdit, isCompleted }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-sky-700">
          <ArrowLeft className="h-4 w-4" /> {t('interviews.backToInterviews') || 'Back to Interviews'}
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{status}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{t('interviews.viewManageInfo') || 'View and manage interview information, notes, and feedback.'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onReschedule} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('interviews.reschedule')}</button>
        <button type="button" disabled={!isCompleted} onClick={onCancel} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50">{t('common.cancel')}</button>
        <button type="button" onClick={onEdit} className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white">{t('common.edit')}</button>
      </div>
    </div>
  );
};

const CandidateSummaryCard = ({ interview, candidateName }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-xl font-semibold text-white">
            {(interview?.applicant?.firstName?.[0] || 'C').toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{candidateName}</h2>
            <p className="mt-1 text-sm font-medium text-sky-700">{interview?.job?.title || t('interviews.jobPosition')}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {interview?.applicant?.email || 'Email pending'}</span>
              <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {interview?.applicant?.phone || 'Phone pending'}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {formatLocationValue(interview?.applicant?.location) || 'Addis Ababa'}</span>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><CalendarDays className="h-4 w-4" /> {t('interviews.interviewDate')}</div>
            <p className="mt-2 text-sm text-slate-900">{interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : t('interviews.pending')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Clock className="h-4 w-4" /> {t('interviews.interviewTime')}</div>
            <p className="mt-2 text-sm text-slate-900">{interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : t('interviews.pending')} · {interview?.duration || '60 min'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Video className="h-4 w-4" /> {t('interviews.interviewType')}</div>
            <p className="mt-2 text-sm text-slate-900">{interview?.type || t('interviews.online')} · {interview?.meetingLink ? 'Google Meet' : t('interviews.meetingLink')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Users className="h-4 w-4" /> {t('interviews.interviewer')}</div>
            <p className="mt-2 text-sm text-slate-900">Recruiter Team</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewSummaryCard = ({ interview, onJoinMeeting, onCopyLink }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-slate-900">Interview Summary</h3>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onJoinMeeting} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"><ExternalLink className="h-4 w-4" /> Join Again</button>
        <button type="button" onClick={onCopyLink} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"><Copy className="h-4 w-4" /> Copy Meeting Link</button>
        <button type="button" onClick={onJoinMeeting} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"><ExternalLink className="h-4 w-4" /> Open Meeting Link</button>
      </div>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {[
        ['Interview Duration', '60 min'],
        ['Scheduled Time', interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Pending'],
        ['Start Time', '09:00 AM'],
        ['End Time', '09:45 AM'],
        ['Interview Type', interview?.type || 'Video Interview'],
        ['Meeting Link', interview?.meetingLink || formatLocationValue(interview?.location) || 'Pending'],
        ['Interviewers', 'Recruiter Team'],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-sm text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  </div>
);

const AgendaCard = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">Interview Agenda</h3>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">100%</span>
    </div>
    <div className="mt-4 h-2 rounded-full bg-slate-100">
      <div className="h-2 w-full rounded-full bg-emerald-500" />
    </div>
    <div className="mt-4 space-y-3">
      {defaultAgenda.map((item) => (
        <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <span className="text-sm font-medium text-slate-900">{item.label}</span>
              <p className="text-xs text-slate-500">{item.duration}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Completed</span>
        </div>
      ))}
    </div>
  </div>
);

const TimelineCard = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">Candidate Timeline</h3>
      <button type="button" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700">View Application</button>
    </div>
    <div className="mt-4 space-y-4 border-l border-slate-200 pl-4">
      {mockTimeline.map((item) => (
        <div key={`${item.title}-${item.date}`} className="relative">
          <div className="absolute -left-[1.08rem] top-1 h-3 w-3 rounded-full border-4 border-white bg-emerald-500" />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>{item.date}</span>
              <span>{item.time}</span>
              <span className="font-medium text-slate-700">{item.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const NotesCard = ({ notes, editing, onEdit, onSave, onCancel, noteDraft, setNoteDraft }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">Interview Notes</h3>
      {!editing && <button type="button" onClick={onEdit} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"><Pencil className="h-4 w-4" /> Edit</button>}
    </div>
    {editing ? (
      <div className="mt-4 space-y-3">
        <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows="6" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSave} className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white">Save Notes</button>
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel Editing</button>
        </div>
      </div>
    ) : (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{notes || 'No notes recorded yet.'}</div>
    )}
  </div>
);

const FilesCard = ({ files }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">Attached Files</h3>
      <label className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700">Upload Files</label>
    </div>
    <div className="mt-4 space-y-3">
      {(files || mockFiles).map((file) => (
        <div key={file.name} className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">{file.size} · Uploaded {file.date}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700"><Download className="h-4 w-4" /> Download</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700"><FileText className="h-4 w-4" /> Preview</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-sm text-rose-700"><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FeedbackCard = ({ evaluation, onSaveEvaluation, rating, setRating, recommendation, setRecommendation, strengths, setStrengths, weaknesses, setWeaknesses, notes, setNotes, finalDecision, setFinalDecision }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">Evaluation</h3>
      <button type="button" onClick={onSaveEvaluation} className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white">Save Evaluation</button>
    </div>
    <div className="mt-4 grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Overall Rating</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <button key={starValue} type="button" onClick={() => setRating(starValue)} className={starValue <= rating ? 'text-amber-500' : 'text-slate-300'}>
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-slate-700">{rating}.0 / 5</span>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Recommendation</label>
        <input value={recommendation} onChange={(event) => setRecommendation(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Strengths</label>
          <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} rows="4" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Weaknesses</label>
          <textarea value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} rows="4" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Additional Notes</label>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="4" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Final Decision</label>
        <select value={finalDecision} onChange={(event) => setFinalDecision(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none">
          <option value="Move to Next Round">Move to Next Round</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
    </div>
  </div>
);

const ActionSidebar = ({ interview, onMoveToNextRound, onSendFeedback, onShareFeedback, onArchive, onDownloadReport, onViewProfile, onDecisionChange, decision }) => (
  <div className="space-y-4">
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Candidate Summary</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div><span className="font-medium text-slate-900">Applied Position:</span> {interview?.job?.title || 'Applied Position'}</div>
        <div><span className="font-medium text-slate-900">Years of Experience:</span> 3+ Years</div>
        <div><span className="font-medium text-slate-900">Current Company:</span> {interview?.company?.name || 'Current company pending'}</div>
        <div><span className="font-medium text-slate-900">Education:</span> BSc in Computer Science</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['React', 'JavaScript', 'TypeScript', 'Node.js', 'HTML/CSS'].map((skill) => (
          <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">{skill}</span>
        ))}
      </div>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{decision}</div>
      <div className="mt-4 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => <Star key={value} className="h-5 w-5 text-amber-500 fill-current" />)}
        <span className="ml-2 text-sm font-medium text-slate-700">5.0 / 5</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['Technical Skills', 'Problem Solving', 'Communication', 'Culture Fit'].map((item) => (
          <span key={item} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{item}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {['System Design', 'Time Management'].map((item) => (
          <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">{item}</span>
        ))}
      </div>
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Final Decision</label>
        <select value={decision} onChange={(event) => onDecisionChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none">
          <option value="Move to Next Round">Move to Next Round</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
      <p className="mt-3 text-sm text-slate-500">Feedback submitted 2 hours ago</p>
    </div>

    <div className="space-y-2">
      <button type="button" onClick={onMoveToNextRound} className="w-full rounded-full bg-[#1769E0] px-4 py-2.5 text-sm font-medium text-white">Move to Next Round</button>
      <button type="button" onClick={onSendFeedback} className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Send Feedback to Candidate</button>
      <button type="button" onClick={onShareFeedback} className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Share Feedback with Team</button>
      <button type="button" onClick={onArchive} className="w-full rounded-full border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700">Archive Interview</button>
      <button type="button" onClick={onDownloadReport} className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Download Evaluation Report</button>
      <button type="button" onClick={onViewProfile} className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">View Candidate Profile</button>
    </div>
  </div>
);

const HistoryTimeline = ({ items }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <h3 className="text-lg font-semibold text-slate-900">Interview History</h3>
    <div className="mt-4 space-y-4 border-l border-slate-200 pl-4">
      {items.map((item) => (
        <div key={`${item.action}-${item.timestamp}`} className="relative">
          <div className="absolute -left-[1.08rem] top-1 h-3 w-3 rounded-full border-4 border-white bg-sky-500" />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">{item.action}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>{item.timestamp}</span>
              <span>Performed by {item.performedBy}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('Move to Next Round');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showEditNotes, setShowEditNotes] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rating, setRating] = useState(5);
  const [recommendation, setRecommendation] = useState('Strong Hire');
  const [strengths, setStrengths] = useState('Technical Skills, Problem Solving, Communication');
  const [weaknesses, setWeaknesses] = useState('System Design, Time Management');
  const [notes, setNotes] = useState('Strong communicator with thoughtful problem-solving and clear team collaboration.');
  const [finalDecision, setFinalDecision] = useState('Move to Next Round');
  const [history, setHistory] = useState([
    { action: 'Interview Scheduled', timestamp: 'May 5, 2025 09:00 AM', performedBy: 'Recruiter Team' },
    { action: 'Reminder Sent', timestamp: 'May 5, 2025 08:30 AM', performedBy: 'Employer' },
    { action: 'Interview Started', timestamp: 'May 5, 2025 10:00 AM', performedBy: 'Employer' },
    { action: 'Interview Completed', timestamp: 'May 5, 2025 10:45 AM', performedBy: 'Employer' },
    { action: 'Feedback Submitted', timestamp: 'May 5, 2025 11:15 AM', performedBy: 'Employer' },
  ]);
  const [attachments] = useState(mockFiles);

  useEffect(() => {
    const storageKey = `completed-interview-${id}`;
    const savedDraft = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(storageKey) || 'null') : null;

    if (savedDraft) {
      setNotesDraft(savedDraft.notesDraft || '');
      setNotes(savedDraft.notes || '');
      setRating(savedDraft.rating || 5);
      setRecommendation(savedDraft.recommendation || 'Strong Hire');
      setStrengths(savedDraft.strengths || 'Technical Skills, Problem Solving, Communication');
      setWeaknesses(savedDraft.weaknesses || 'System Design, Time Management');
      setFinalDecision(savedDraft.finalDecision || 'Move to Next Round');
      setDecision(savedDraft.finalDecision || 'Move to Next Round');
      setHistory(savedDraft.history || [
        { action: 'Interview Scheduled', timestamp: 'May 5, 2025 09:00 AM', performedBy: 'Recruiter Team' },
        { action: 'Reminder Sent', timestamp: 'May 5, 2025 08:30 AM', performedBy: 'Employer' },
        { action: 'Interview Started', timestamp: 'May 5, 2025 10:00 AM', performedBy: 'Employer' },
        { action: 'Interview Completed', timestamp: 'May 5, 2025 10:45 AM', performedBy: 'Employer' },
        { action: 'Feedback Submitted', timestamp: 'May 5, 2025 11:15 AM', performedBy: 'Employer' },
      ]);
    }

    const loadInterview = async () => {
      try {
        const response = await api.get(`/interviews/${id}`);
        const data = response.data?.data || response.data;
        setInterview(data);
        setNotesDraft(data?.note || data?.feedback || savedDraft?.notesDraft || notes);
        setDecision(data?.finalDecision || savedDraft?.finalDecision || 'Move to Next Round');
        setFinalDecision(data?.finalDecision || savedDraft?.finalDecision || 'Move to Next Round');
        setNotes(data?.note || data?.feedback || savedDraft?.notes || notes);
        setRating(data?.rating || savedDraft?.rating || 5);
        setRecommendation(data?.recommendation || savedDraft?.recommendation || 'Strong Hire');
        setStrengths(data?.strengths || savedDraft?.strengths || 'Technical Skills, Problem Solving, Communication');
        setWeaknesses(data?.weaknesses || savedDraft?.weaknesses || 'System Design, Time Management');
        setHistory(data?.history || savedDraft?.history || history);
      } catch {
        setInterview(mockInterview);
        setNotesDraft(savedDraft?.notesDraft || mockInterview.note || '');
        setDecision(savedDraft?.finalDecision || mockInterview.finalDecision || 'Move to Next Round');
        setFinalDecision(savedDraft?.finalDecision || mockInterview.finalDecision || 'Move to Next Round');
        setNotes(savedDraft?.notes || mockInterview.note || '');
        setRating(savedDraft?.rating || mockInterview.rating || 5);
        setRecommendation(savedDraft?.recommendation || mockInterview.recommendation || 'Strong Hire');
        setStrengths(savedDraft?.strengths || mockInterview.strengths || 'Technical Skills, Problem Solving, Communication');
        setWeaknesses(savedDraft?.weaknesses || mockInterview.weaknesses || 'System Design, Time Management');
        setHistory(savedDraft?.history || mockInterview.history || history);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadInterview();
  }, [id]);

  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    const storageKey = `completed-interview-${id}`;
    localStorage.setItem(storageKey, JSON.stringify({
      notesDraft,
      notes,
      rating,
      recommendation,
      strengths,
      weaknesses,
      finalDecision,
      history,
    }));
  }, [id, notesDraft, notes, rating, recommendation, strengths, weaknesses, finalDecision, history]);

  const candidateName = useMemo(() => {
    const parts = [`${interview?.applicant?.firstName || ''}`.trim(), `${interview?.applicant?.lastName || ''}`.trim()].filter(Boolean);
    return parts.join(' ') || 'Candidate';
  }, [interview]);

  const handleSaveNotes = async () => {
    try {
      await api.put(`/interviews/${id}`, { note: notesDraft, feedback: notesDraft });
      setInterview((prev) => (prev ? { ...prev, note: notesDraft, feedback: notesDraft } : prev));
      setNotes(notesDraft);
      setShowEditNotes(false);
      setHistory((prev) => [{ action: 'Interview Notes Updated', timestamp: new Date().toLocaleString(), performedBy: 'Employer' }, ...prev]);
      toast.success('Interview notes updated successfully.');
    } catch {
      toast.error('Unable to update interview notes.');
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      await api.put(`/interviews/${id}`, {
        rating,
        recommendation,
        strengths,
        weaknesses,
        finalDecision,
        note: notes,
        feedback: notes,
      });
      setInterview((prev) => (prev ? { ...prev, rating, recommendation, strengths, weaknesses, finalDecision, note: notes, feedback: notes } : prev));
      setDecision(finalDecision);
      setHistory((prev) => [{ action: 'Feedback Submitted', timestamp: new Date().toLocaleString(), performedBy: 'Employer' }, ...prev]);
      toast.success('Interview evaluation updated successfully.');
    } catch {
      toast.error('Unable to update interview evaluation.');
    }
  };

  const handleDecisionChange = async (value) => {
    try {
      await api.put(`/interviews/${id}`, { finalDecision: value, result: value === 'Hired' ? 'pass' : value === 'Rejected' ? 'fail' : 'pending' });
      setDecision(value);
      setFinalDecision(value);
      setInterview((prev) => (prev ? { ...prev, finalDecision: value } : prev));
      toast.success(`Decision updated to ${value}.`);
    } catch {
      toast.error('Unable to update interview decision.');
    }
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    if (!newDate || !newTime) {
      toast.error('Please select both date and time.');
      return;
    }

    try {
      const scheduledDate = new Date(`${newDate}T${newTime}`).toISOString();
      await api.put(`/interviews/${id}`, { scheduledDate });
      setInterview((prev) => (prev ? { ...prev, scheduledDate } : prev));
      setShowRescheduleModal(false);
      toast.success('Interview rescheduled successfully.');
    } catch {
      toast.error('Unable to reschedule interview.');
    }
  };

  const handleEditInterview = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        type: interview?.type || 'Video Interview',
        location: interview?.location || '',
        meetingLink: interview?.meetingLink || '',
        note: notesDraft,
      };
      await api.put(`/interviews/${id}`, payload);
      setInterview((prev) => (prev ? { ...prev, ...payload } : prev));
      setShowEditModal(false);
      toast.success('Interview details updated successfully.');
    } catch {
      toast.error('Unable to update interview details.');
    }
  };

  const handleCancel = async () => {
    if (interview?.status?.toLowerCase() === 'completed') {
      toast.error('Completed interviews cannot be canceled.');
      return;
    }

    try {
      await api.put(`/interviews/${id}`, { status: 'cancelled' });
      setInterview((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      setShowCancelConfirm(false);
      toast.success('Interview canceled successfully.');
    } catch {
      toast.error('Unable to cancel interview.');
    }
  };

  const handleJoinMeeting = () => {
    const link = interview?.meetingLink || interview?.location;
    if (!link) {
      toast.error('No meeting link is available for this interview.');
      return;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
    toast.success('Opening interview meeting link.');
  };

  const handleCopyMeetingLink = async () => {
    const link = interview?.meetingLink || interview?.location;
    if (!link) {
      toast.error('No meeting link is available to copy.');
      return;
    }

    await navigator.clipboard.writeText(link);
    toast.success('Meeting link copied.');
  };

  const handleMoveToNextRound = async () => {
    try {
      const payload = {
        application: interview?.application || interview?._id,
        job: interview?.job?._id || interview?.job,
        applicant: interview?.applicant?._id || interview?.applicant,
        company: interview?.company?._id || interview?.company,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: interview?.type || 'Video',
        location: interview?.location || interview?.meetingLink,
        meetingLink: interview?.meetingLink,
        note: interview?.note || interview?.feedback,
        status: 'scheduled',
      };
      await api.post('/interviews', payload);
      setInterview((prev) => (prev ? { ...prev, status: 'completed', currentStage: 'Final Round' } : prev));
      setHistory((prev) => [{ action: 'Moved to Next Round', timestamp: new Date().toLocaleString(), performedBy: 'Employer' }, ...prev]);
      toast.success('Candidate moved to the next interview round.');
    } catch {
      toast.error('Unable to move candidate to the next round.');
    }
  };

  const handleArchive = async () => {
    const confirmed = window.confirm('Archive this completed interview?');
    if (!confirmed) return;

    try {
      await api.put(`/interviews/${id}`, { status: 'archived' });
      setInterview((prev) => (prev ? { ...prev, status: 'archived' } : prev));
      setHistory((prev) => [{ action: 'Archived', timestamp: new Date().toLocaleString(), performedBy: 'Employer' }, ...prev]);
      toast.success('Interview archived successfully.');
    } catch {
      toast.error('Unable to archive interview.');
    }
  };

  const handleDownloadReport = () => {
    const report = `Interview Report\n\nCandidate: ${candidateName}\nPosition: ${interview?.job?.title || 'Applied Position'}\nEmail: ${interview?.applicant?.email || 'Email pending'}\nPhone: ${interview?.applicant?.phone || 'Phone pending'}\n\nInterview Information\nType: ${interview?.type || 'Video Interview'}\nDate: ${interview?.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not scheduled'}\nMeeting Link: ${interview?.meetingLink || interview?.location || 'Pending'}\n\nNotes: ${notes}\nRating: ${rating}/5\nRecommendation: ${recommendation}\nStrengths: ${strengths}\nWeaknesses: ${weaknesses}\nFinal Decision: ${finalDecision}`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-report-${candidateName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Interview report downloaded.');
  };

  const isCompleted = (interview?.status || '').toLowerCase() === 'completed';

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 text-sm text-slate-600 shadow-sm">Loading interview details...</div>;
  }

  if (!interview) {
    return <div className="rounded-3xl bg-white p-8 text-sm text-slate-600 shadow-sm">Interview not found.</div>;
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <CompletedInterviewHeader
        onBack={() => navigate('/employer/interviews')}
        title="Interview Details"
        status={interview?.status || 'Completed'}
        onReschedule={() => setShowRescheduleModal(true)}
        onCancel={handleCancel}
        onEdit={() => setShowEditModal(true)}
        isCompleted={isCompleted}
      />

      <div className="mt-6 space-y-6">
        <CandidateSummaryCard interview={interview} candidateName={candidateName} />

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
          <div className="space-y-4">
            {activeTab === 'Overview' && (
              <>
                <InterviewSummaryCard interview={interview} onJoinMeeting={handleJoinMeeting} onCopyLink={handleCopyMeetingLink} />
                <AgendaCard />
                <TimelineCard />
                <NotesCard
                  notes={notes}
                  editing={showEditNotes}
                  onEdit={() => setShowEditNotes(true)}
                  onSave={handleSaveNotes}
                  onCancel={() => setShowEditNotes(false)}
                  noteDraft={notesDraft}
                  setNoteDraft={setNotesDraft}
                />
                <FilesCard files={attachments} />
              </>
            )}

            {activeTab === 'Notes' && (
              <NotesCard
                notes={notes}
                editing={showEditNotes}
                onEdit={() => setShowEditNotes(true)}
                onSave={handleSaveNotes}
                onCancel={() => setShowEditNotes(false)}
                noteDraft={notesDraft}
                setNoteDraft={setNotesDraft}
              />
            )}

            {activeTab === 'Feedback' && (
              <FeedbackCard
                evaluation={interview}
                onSaveEvaluation={handleSaveEvaluation}
                rating={rating}
                setRating={setRating}
                recommendation={recommendation}
                setRecommendation={setRecommendation}
                strengths={strengths}
                setStrengths={setStrengths}
                weaknesses={weaknesses}
                setWeaknesses={setWeaknesses}
                notes={notes}
                setNotes={setNotes}
                finalDecision={finalDecision}
                setFinalDecision={setFinalDecision}
              />
            )}

            {activeTab === 'Files' && <FilesCard files={attachments} />}
            {activeTab === 'History' && <HistoryTimeline items={history} />}
          </div>

          <ActionSidebar
            interview={interview}
            onMoveToNextRound={handleMoveToNextRound}
            onSendFeedback={() => toast.success('Feedback sent to candidate.')}
            onShareFeedback={() => toast.success('Feedback shared with the team.')}
            onArchive={handleArchive}
            onDownloadReport={handleDownloadReport}
            onViewProfile={() => toast.success('Candidate profile opened.')}
            onDecisionChange={handleDecisionChange}
            decision={decision}
          />
        </div>
      </div>

      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Reschedule Interview</h3>
            <p className="mt-1 text-sm text-slate-600">Update the interview date and time.</p>
            <form onSubmit={handleReschedule} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Time</label>
                <input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Edit Interview Details</h3>
            <p className="mt-1 text-sm text-slate-600">Adjust the interview information and notes.</p>
            <form onSubmit={handleEditInterview} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Interview Type</label>
                <input value={interview?.type || 'Video Interview'} onChange={(event) => setInterview((prev) => ({ ...prev, type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Meeting Link</label>
                <input value={interview?.meetingLink || ''} onChange={(event) => setInterview((prev) => ({ ...prev, meetingLink: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} rows="4" className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Cancel interview?</h3>
            <p className="mt-2 text-sm text-slate-600">This will mark the interview as canceled and remove it from the active schedule.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCancelConfirm(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Keep it</button>
              <button type="button" onClick={handleCancel} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewDetails;
