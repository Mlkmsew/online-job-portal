import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNowStrict, isToday, isTomorrow, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Award, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileText, Link2, Mail, MapPin, Phone, PlayCircle, Search, Sparkles, SquarePen, Star, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import LiveInterview from './components/LiveInterview';
import FinishInterview from './components/FinishInterview';
import InterviewSummary from './components/InterviewSummary';
import PreInterviewLobby from './components/PreInterviewLobby';
import InterviewRoom from './components/InterviewRoom';
import InterviewEvaluation from './components/InterviewEvaluation';
import InterviewRoundProgress from './components/InterviewRoundProgress';
import InterviewCompletedSummary from './components/InterviewCompletedSummary';
import HiringDecisionHub from './components/HiringDecisionHub';

const tabs = [
  { value: 'Upcoming', labelKey: 'employer.tabs.upcoming' },
  { value: 'Completed', labelKey: 'employer.tabs.completed' },
  { value: 'Canceled', labelKey: 'employer.tabs.canceled' },
  { value: 'All', labelKey: 'employer.tabs.all' },
];

const getTabStatuses = (tab) => {
  switch (tab) {
    case 'Completed':
      return ['completed'];
    case 'Canceled':
    case 'Cancelled':
      return ['cancelled', 'canceled'];
    default:
      return ['scheduled', 'upcoming'];
  }
};

const getInterviewTypeLabel = (type, t) => {
  if (!type) return t ? t('interviews.inPerson') : 'Onsite';
  const normalizedType = (type || '').toLowerCase();
  if (normalizedType.includes('zoom') || normalizedType.includes('meet') || normalizedType.includes('video') || normalizedType.includes('online')) return t ? t('interviews.online') : 'Online';
  if (normalizedType.includes('phone')) return t ? t('interviews.phone') : 'Phone';
  if (normalizedType.includes('in-person') || normalizedType.includes('in person') || normalizedType.includes('onsite')) return t ? t('interviews.inPerson') : 'Onsite';
  return type;
};

const buildInterviewPayload = (form, application, applicantId) => {
  const normalizedType = form.interviewType || 'In-person';

  return {
    candidateId: applicantId || application.applicant?._id || application.applicant,
    applicationId: application._id,
    jobId: application.job?._id || application.job,
    interviewDate: form.scheduledDate,
    interviewTime: form.scheduledTime,
    interviewType: normalizedType,
    meetingLocationOrLink: form.locationOrLink,
    invitationNotes: form.notes,
  };
};

const normalizeResultValue = (value) => {
  if (!value) return 'pending';
  const normalized = `${value}`.trim().toLowerCase();
  if (['passed', 'hired', 'hire', 'accepted'].includes(normalized)) return 'pass';
  if (['rejected', 'failed', 'fail', 'no hire', 'not selected'].includes(normalized)) return 'fail';
  if (['pending', 'pending evaluation', 'review'].includes(normalized)) return 'pending';
  return normalized;
};

const formatResultLabel = (value, t) => {
  if (!value) return t ? t('interviews.pending') : 'Pending';
  const normalized = `${value}`.trim().toLowerCase();
  if (['passed', 'pass', 'hired', 'hire', 'accepted'].includes(normalized)) return t ? t('interviews.hired') : 'Hired';
  if (['rejected', 'failed', 'fail', 'no hire', 'not selected'].includes(normalized)) return t ? t('interviews.rejected') : 'Rejected';
  if (['pending', 'pending evaluation', 'review'].includes(normalized)) return t ? t('interviews.pendingEvaluation') : 'Pending Evaluation';
  return value;
};

const getEvaluationStatus = (interview, t) => {
  const decision = interview?.finalDecision || interview?.result || interview?.feedback || interview?.rating;
  if (decision) {
    const normalized = `${decision}`.trim().toLowerCase();
    if (['hired', 'hire', 'accepted'].includes(normalized)) return t ? t('interviews.hired') : 'Hired';
    if (['passed', 'pass', 'move to next round'].includes(normalized)) return t ? t('interviews.passed') : 'Passed';
    if (['rejected', 'failed', 'fail', 'not selected'].includes(normalized)) return t ? t('interviews.rejected') : 'Rejected';
    if (['pending', 'pending evaluation', 'review'].includes(normalized)) return t ? t('interviews.pendingEvaluation') : 'Pending Evaluation';
    return interview.finalDecision || formatResultLabel(interview.result, t);
  }
  return t ? t('interviews.pendingEvaluation') : 'Pending Evaluation';
};

const normalizeStatus = (status) => `${status || 'scheduled'}`.toLowerCase();

const getStatusBadgeClasses = (status) => {
  switch (normalizeStatus(status)) {
    case 'completed':
      return 'bg-[#EAF2FE] text-[#0A4FA8] border-[#A8C8F5]';
    case 'cancelled':
    case 'canceled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

const MetricCard = ({ title, value, subtitle, icon: Icon, accent }) => (
  <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className={`rounded-2xl p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const EmployerInterviews = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviewCandidates, setInterviewCandidates] = useState([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [dateFilter, setDateFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showAssessmentDetailsModal, setShowAssessmentDetailsModal] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [form, setForm] = useState({
    applicationId: '',
    scheduledDate: '',
    scheduledTime: '',
    interviewType: '',
    locationOrLink: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [scheduledSummary, setScheduledSummary] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [resultByInterview, setResultByInterview] = useState({});
  const [editForm, setEditForm] = useState({ scheduledDate: '', scheduledTime: '', locationOrLink: '' });
  const [linkForm, setLinkForm] = useState({ locationOrLink: '' });
  const [assessmentForm, setAssessmentForm] = useState({ notes: '', rating: 0, strengths: '', weaknesses: '', finalDecision: 'Pending Evaluation' });
  const [workflowForm, setWorkflowForm] = useState({ notes: '', rating: '', strengths: '', weaknesses: '', recommendation: '', finalDecision: '' });
  const [workflowNotes, setWorkflowNotes] = useState('');

  const nowDate = new Date();
  const todayISO = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;

  const validateScheduleForm = (values) => {
    const errors = {};
    if (!values.applicationId) errors.candidate = 'Please select a candidate.';
    if (!values.scheduledDate) {
      errors.date = 'Please select an interview date.';
    } else if (values.scheduledDate < todayISO) {
      errors.date = 'Interview date cannot be in the past.';
    }
    if (!values.scheduledTime) errors.time = 'Please select an interview time.';
    if (!values.interviewType) {
      errors.type = 'Please select an interview type.';
    } else if (values.interviewType === 'In-person' && !values.locationOrLink.trim()) {
      errors.locationOrLink = 'Please provide the interview location.';
    } else if (values.interviewType === 'Video' && !values.locationOrLink.trim()) {
      errors.locationOrLink = 'Please provide the meeting link.';
    }
    return errors;
  };

  const formatTimeValue = (value) => {
    if (!value) return '';
    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [interviewsResponse, applicationsResponse] = await Promise.all([
        api.get('/interviews'),
        api.get('/applications/employer'),
      ]);

      setInterviews(Array.isArray(interviewsResponse.data?.data) ? interviewsResponse.data.data : Array.isArray(interviewsResponse.data) ? interviewsResponse.data : []);
      setApplications(Array.isArray(applicationsResponse.data?.data) ? applicationsResponse.data.data : Array.isArray(applicationsResponse.data) ? applicationsResponse.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewCandidates = async () => {
    setCandidatesLoading(true);
    setCandidatesError('');

    try {
      const response = await api.get('/interviews/shortlisted-candidates');
      let candidates = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      if (!candidates.length) {
        const fallbackResponse = await api.get('/applications/employer');
        const applications = Array.isArray(fallbackResponse.data?.data)
          ? fallbackResponse.data.data
          : Array.isArray(fallbackResponse.data)
            ? fallbackResponse.data
            : [];

        candidates = applications
          .filter((application) => ['Shortlisted', 'Interview', 'Interview Scheduled', 'Selected', 'Accepted'].includes(application.status))
          .map((application) => ({
            _id: application._id,
            applicationId: application._id,
            candidateId: application.applicant?._id || application.applicant,
            userId: application.applicant?._id || application.applicant,
            fullName: `${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim(),
            email: application.applicant?.email || '',
            jobTitle: application.job?.title || '',
            status: application.status,
          }));
      }

      setInterviewCandidates(candidates);
    } catch (error) {
      console.error('Failed to load interview candidates', error);
      setInterviewCandidates([]);
      setCandidatesError('Unable to load candidates. Please try again.');
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, dateFilter, searchTerm]);

  const shortlistedCandidates = useMemo(() => {
    return applications.filter((application) => {
      const status = (application.status || '').toLowerCase();
      return status.includes('shortlist') || status.includes('interview') || status === 'selected';
    });
  }, [applications]);

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const allowedStatuses = getTabStatuses(activeTab);

    return [...interviews]
      .filter((interview) => {
        const status = normalizeStatus(interview.status);
        const matchesTab = activeTab === 'All' ? true : allowedStatuses.includes(status);
        if (!matchesTab) return false;

        const scheduledDate = interview.scheduledDate ? new Date(interview.scheduledDate) : null;
        if (!scheduledDate) return dateFilter === 'All';

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        switch (dateFilter) {
          case 'Today':
            return scheduledDate.toDateString() === now.toDateString();
          case 'Tomorrow': {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            return scheduledDate.toDateString() === tomorrow.toDateString();
          }
          case 'This Week':
            return scheduledDate >= startOfWeek && scheduledDate <= endOfWeek;
          case 'This Month':
            return scheduledDate >= startOfMonth && scheduledDate <= endOfMonth;
          default:
            return true;
        }
      })
      .filter((interview) => {
        if (!normalizedSearch) return true;
        const candidateName = `${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim().toLowerCase();
        const email = (interview.applicant?.email || '').toLowerCase();
        const jobTitle = (interview.job?.title || '').toLowerCase();
        return candidateName.includes(normalizedSearch) || email.includes(normalizedSearch) || jobTitle.includes(normalizedSearch);
      })
      .sort((left, right) => new Date(left.scheduledDate || 0) - new Date(right.scheduledDate || 0));
  }, [activeTab, dateFilter, interviews, searchTerm]);

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredInterviews.length / itemsPerPage));
  const paginatedInterviews = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredInterviews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInterviews, page]);

  const stats = useMemo(() => {
    const upcoming = interviews.filter((interview) => ['scheduled', 'upcoming'].includes(normalizeStatus(interview.status))).length;
    const today = interviews.filter((interview) => {
      const scheduledDate = interview.scheduledDate ? new Date(interview.scheduledDate) : null;
      return scheduledDate && scheduledDate.toDateString() === new Date().toDateString();
    }).length;
    const completed = interviews.filter((interview) => normalizeStatus(interview.status) === 'completed').length;
    const cancelled = interviews.filter((interview) => ['cancelled', 'canceled'].includes(normalizeStatus(interview.status))).length;

    return { upcoming, today, completed, cancelled };
  }, [interviews]);

  const typeSummary = useMemo(() => {
    const onlineLabel = t('interviews.online');
    const onsiteLabel = t('interviews.inPerson');
    const phoneLabel = t('interviews.phone');
    const counts = { [onlineLabel]: 0, [onsiteLabel]: 0, [phoneLabel]: 0 };

    interviews.forEach((interview) => {
      const type = getInterviewTypeLabel(interview.type || '', t).toLowerCase();
      if (type.includes('phone') || type.includes('በስልክ')) counts[phoneLabel] += 1;
      else if (type.includes('online') || type.includes('video') || type.includes('zoom') || type.includes('meet') || type.includes('በኦንላይን')) counts[onlineLabel] += 1;
      else counts[onsiteLabel] += 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [interviews, t]);

  const calendarDates = useMemo(() => new Set(interviews.map((interview) => new Date(interview.scheduledDate).toDateString())), [interviews]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getReminderStatus = (scheduledDate) => {
    if (!scheduledDate) return { label: t('interviews.future'), color: 'bg-slate-300', icon: '⚪' };

    const minutesUntil = differenceInMinutes(scheduledDate, currentTime);
    if (minutesUntil < 0) return { label: t('interviews.overdue'), color: 'bg-rose-500', icon: '🔴' };
    if (minutesUntil <= 30) return { label: t('interviews.startingSoon'), color: 'bg-[#1769E0]', icon: '🔵' };
    if (minutesUntil <= 120) return { label: t('interviews.laterToday'), color: 'bg-amber-500', icon: '🟡' };
    if (isToday(scheduledDate)) return { label: t('interviews.laterToday'), color: 'bg-sky-500', icon: '🔵' };
    return { label: t('interviews.future'), color: 'bg-slate-300', icon: '⚪' };
  };

  const getReminderText = (scheduledDate) => {
    if (!scheduledDate) return t('interviews.dateNotAvailable') || 'Date not available';
    const minutesUntil = differenceInMinutes(scheduledDate, currentTime);

    if (minutesUntil < 0) return t('interviews.overdue');
    if (minutesUntil <= 30) return `${t('interviews.interviewStartsIn') || 'Interview starts in'} ${minutesUntil} ${t('applications.minutes') || 'min'}`;
    if (minutesUntil < 120) {
      const hours = Math.floor(minutesUntil / 60);
      return `${t('interviews.interviewStartsIn') || 'Interview starts in'} ${hours} ${t('applications.hours') || 'hours'}`;
    }
    if (isToday(scheduledDate)) return t('interviews.laterToday');
    if (isTomorrow(scheduledDate)) return t('interviews.tomorrowFilter');
    const daysUntil = differenceInDays(scheduledDate, currentTime);
    return `${t('interviews.in') || 'In'} ${daysUntil} ${t('applications.days') || 'days'}`;
  };

  const getReminderMeta = (scheduledDate, jobTitle) => {
    if (!scheduledDate) return t('interviews.dateNotAvailable') || 'Date not available';
    const dayLabel = isToday(scheduledDate) ? t('interviews.todayFilter') : isTomorrow(scheduledDate) ? t('interviews.tomorrowFilter') : format(scheduledDate, 'MMM d');
    return `${dayLabel} • ${format(scheduledDate, 'h:mm a')} • ${jobTitle || t('interviews.pipeline')}`;
  };

  const upcomingReminders = useMemo(() => {
    return [...interviews]
      .filter((interview) => {
        const status = normalizeStatus(interview.status);
        const scheduledDate = interview.scheduledDate ? new Date(interview.scheduledDate) : null;
        return scheduledDate && !['completed', 'cancelled', 'canceled'].includes(status);
      })
      .sort((left, right) => new Date(left.scheduledDate) - new Date(right.scheduledDate));
  }, [interviews, currentTime]);

  const resetModal = () => {
    setShowModal(false);
    setShowFeedbackModal(false);
    setShowDetailsModal(false);
    setShowEditModal(false);
    setShowLinkModal(false);
    setShowAssessmentModal(false);
    setShowAssessmentDetailsModal(false);
    setShowWorkflow(false);
    setWorkflowStep(1);
    setSelectedInterview(null);
    setSelectedApplicantId('');
    setForm({
      applicationId: '',
      scheduledDate: '',
      scheduledTime: '',
      interviewType: '',
      locationOrLink: '',
      notes: '',
    });
    setFormErrors({});
    setScheduledSummary(null);
    setFeedback('');
    setNotes('');
    setEditForm({ scheduledDate: '', scheduledTime: '', locationOrLink: '' });
    setLinkForm({ locationOrLink: '' });
    setAssessmentForm({ notes: '', rating: 0, strengths: '', weaknesses: '', finalDecision: 'Pending Evaluation' });
  };

  const openScheduleModal = async () => {
    resetModal();
    setShowModal(true);
    await loadInterviewCandidates();
  };

  const openFeedbackModal = (interview) => {
    setSelectedInterview(interview);
    setFeedback(interview.feedback || '');
    setNotes(interview.note || '');
    setShowFeedbackModal(true);
  };

  const openDetailsModal = (interview) => {
    if (interview?._id) {
      navigate(`/employer/interviews/${interview._id}`);
      return;
    }
    setSelectedInterview(interview);
    setShowDetailsModal(true);
  };

  const openEditModal = (interview) => {
    setSelectedInterview(interview);
    const parsedDate = interview.scheduledDate ? new Date(interview.scheduledDate) : new Date();
    setEditForm({
      scheduledDate: parsedDate.toISOString().split('T')[0],
      scheduledTime: parsedDate.toTimeString().slice(0, 5),
      locationOrLink: interview.meetingLink || interview.location || '',
    });
    setShowEditModal(true);
  };

  const openLinkModal = (interview) => {
    setSelectedInterview(interview);
    setLinkForm({ locationOrLink: interview.meetingLink || interview.location || '' });
    setShowLinkModal(true);
  };

  const openAssessmentModal = (interview) => {
    setSelectedInterview(interview);
    setAssessmentForm({
      notes: interview.feedback || interview.note || '',
      rating: interview.rating || 0,
      strengths: interview.strengths || '',
      weaknesses: interview.weaknesses || '',
      finalDecision: interview.finalDecision || formatResultLabel(interview.result) || 'Pending Evaluation',
    });
    setShowAssessmentModal(true);
  };

  const openAssessmentDetailsModal = (interview) => {
    setSelectedInterview(interview);
    setShowAssessmentDetailsModal(true);
  };

  const startInterviewWorkflow = (interview) => {
    setSelectedInterview(interview);
    setNotes(interview.note || '');
    setWorkflowForm({
      notes: interview.feedback || interview.note || '',
      rating: interview.rating || '',
      strengths: interview.strengths || '',
      weaknesses: interview.weaknesses || '',
      recommendation: interview.recommendation || '',
      finalDecision: interview.finalDecision || '',
    });
    setWorkflowStep(1);
    setWorkflowNotes(interview.note || '');
    setShowWorkflow(true);
  };

  const handleWorkflowSaveNotes = async () => {
    if (!selectedInterview) return;

    try {
      const response = await api.put(`/interviews/${selectedInterview._id}`, { note: workflowNotes, feedback: workflowNotes });
      const updatedInterview = response.data?.data;
      setInterviews((prev) => prev.map((item) => (item._id === selectedInterview._id ? { ...item, ...(updatedInterview || {}), note: workflowNotes, feedback: workflowNotes } : item)));
      toast.success('Interview notes saved.');
    } catch {
      toast.error('Unable to save notes.');
    }
  };

  const handleWorkflowFinish = async () => {
    if (!selectedInterview) return;

    setWorkflowStep(3);
    toast.success('Interview moved to evaluation step.');
  };

  const handleWorkflowSubmit = async () => {
    if (!selectedInterview) return;

    const finalDecision = workflowForm.finalDecision || 'Pending Evaluation';
    try {
      const response = await api.put(`/interviews/${selectedInterview._id}`, {
        feedback: workflowForm.notes,
        note: workflowForm.notes,
        rating: workflowForm.rating,
        strengths: workflowForm.strengths,
        weaknesses: workflowForm.weaknesses,
        recommendation: workflowForm.recommendation,
        finalDecision,
        result: normalizeResultValue(finalDecision),
        status: 'completed',
      });
      const updatedInterview = response.data?.data;
      setInterviews((prev) => prev.map((item) => (item._id === selectedInterview._id ? {
        ...item,
        ...(updatedInterview || {}),
        feedback: workflowForm.notes,
        note: workflowForm.notes,
        rating: workflowForm.rating,
        strengths: workflowForm.strengths,
        weaknesses: workflowForm.weaknesses,
        recommendation: workflowForm.recommendation,
        finalDecision,
        result: normalizeResultValue(finalDecision),
        status: 'completed',
      } : item)));
      setWorkflowStep(5);
      toast.success('Interview evaluation recorded successfully.');
    } catch {
      toast.error('Unable to save the interview evaluation.');
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateScheduleForm(form);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please complete the required fields to schedule the interview.');
      return;
    }

    const selectedApplication = applications.find((application) => application._id === form.applicationId);
    if (!selectedApplication) return;

    setSubmitting(true);
    try {
      const payload = buildInterviewPayload(form, selectedApplication, selectedApplicantId);
      const response = await api.post('/interviews', payload);
      const createdInterview = response.data?.data;

      if (createdInterview) {
        setInterviews((prev) => [
          {
            ...createdInterview,
            applicant: createdInterview.applicant || selectedApplication.applicant,
            job: createdInterview.job || selectedApplication.job,
            company: createdInterview.company || selectedApplication.company,
          },
          ...prev,
        ]);
      } else {
        await loadData();
      }

      const scheduledDate = createdInterview?.scheduledDate ? new Date(createdInterview.scheduledDate) : null;
      const selectedCandidate = interviewCandidates.find((candidate) => candidate.applicationId === form.applicationId);
      setScheduledSummary({
        candidateName: selectedCandidate?.fullName || `${selectedApplication.applicant?.firstName || ''} ${selectedApplication.applicant?.lastName || ''}`.trim() || 'Candidate',
        date: scheduledDate ? format(scheduledDate, 'MMM d, yyyy') : form.scheduledDate,
        time: scheduledDate ? format(scheduledDate, 'h:mm a') : form.scheduledTime,
        type: form.interviewType === 'Video' ? 'Online' : form.interviewType || 'In-Person',
        locationOrLink: form.locationOrLink.trim() || '—',
      });
      toast.success('Interview scheduled successfully.');
    } catch {
      toast.error('Unable to schedule the interview right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (interviewId, status) => {
    try {
      await api.put(`/interviews/${interviewId}`, { status });
      setInterviews((prev) => prev.map((item) => (item._id === interviewId ? { ...item, status } : item)));
      toast.success(`Interview marked as ${status}.`);
    } catch {
      toast.error('Unable to update interview status.');
    }
  };

  const handleResultChange = async (interviewId, result) => {
    const normalizedResult = normalizeResultValue(result);
    const displayResult = formatResultLabel(result);
    try {
      await api.put(`/interviews/${interviewId}`, { result: normalizedResult });
      setInterviews((prev) => prev.map((item) => (item._id === interviewId ? { ...item, result: normalizedResult, finalDecision: displayResult } : item)));
      setResultByInterview((prev) => ({ ...prev, [interviewId]: displayResult }));
      toast.success(`Candidate result updated to ${displayResult}.`);
    } catch {
      toast.error('Unable to update candidate result.');
    }
  };

  const handleFeedbackSave = async (event) => {
    event.preventDefault();
    if (!selectedInterview) return;

    try {
      const response = await api.put(`/interviews/${selectedInterview._id}`, { feedback, note: notes });
      const updatedInterview = response.data?.data;
      setInterviews((prev) => prev.map((item) => (item._id === selectedInterview._id ? { ...item, ...(updatedInterview || {}), feedback, note: notes } : item)));
      resetModal();
    } catch {
    }
  };

  const handleAssessmentSave = async (event) => {
    event.preventDefault();
    if (!selectedInterview) return;

    const finalDecision = assessmentForm.finalDecision || 'Pending Evaluation';
    try {
      const response = await api.put(`/interviews/${selectedInterview._id}`, {
        feedback: assessmentForm.notes,
        note: assessmentForm.notes,
        rating: assessmentForm.rating,
        strengths: assessmentForm.strengths,
        weaknesses: assessmentForm.weaknesses,
        finalDecision,
        result: normalizeResultValue(finalDecision),
      });
      const updatedInterview = response.data?.data;
      setInterviews((prev) => prev.map((item) => (item._id === selectedInterview._id ? {
        ...item,
        ...(updatedInterview || {}),
        feedback: assessmentForm.notes,
        note: assessmentForm.notes,
        rating: assessmentForm.rating,
        strengths: assessmentForm.strengths,
        weaknesses: assessmentForm.weaknesses,
        finalDecision,
        result: normalizeResultValue(finalDecision),
      } : item)));
      setResultByInterview((prev) => ({ ...prev, [selectedInterview._id]: finalDecision }));
      resetModal();
      toast.success('Interview evaluation recorded successfully.');
    } catch {
      toast.error('Unable to save the interview evaluation.');
    }
  };

  const handleLinkSubmit = async (event) => {
    event.preventDefault();
    if (!selectedInterview) return;

    const onlineTypes = ['zoom', 'meet', 'video', 'online'];
    const isOnline = onlineTypes.some((type) => (selectedInterview.type || '').toLowerCase().includes(type));

    try {
      const payload = isOnline ? { meetingLink: linkForm.locationOrLink, location: linkForm.locationOrLink } : { location: linkForm.locationOrLink };
      await api.put(`/interviews/${selectedInterview._id}`, payload);
      setInterviews((prev) => prev.map((item) => (item._id === selectedInterview._id ? { ...item, ...payload } : item)));
      resetModal();
      toast.success('Meeting link/location updated successfully.');
    } catch {
      toast.error('Unable to update meeting details.');
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!selectedInterview) return;

    if (!editForm.scheduledDate || !editForm.scheduledTime) {
      toast.error('Please select both date and time.');
      return;
    }

    try {
      const updatedDate = new Date(`${editForm.scheduledDate}T${editForm.scheduledTime || '09:00'}`);
      const response = await api.put(`/interviews/${selectedInterview._id}`, {
        scheduledDate: updatedDate.toISOString(),
        location: editForm.locationOrLink,
        meetingLink: editForm.locationOrLink,
      });
      const updatedInterview = response.data?.data;
      setInterviews((prev) => prev.map((item) => (item._id === selectedInterview._id ? { ...item, ...(updatedInterview || {}), scheduledDate: updatedDate.toISOString(), location: editForm.locationOrLink, meetingLink: editForm.locationOrLink } : item)));
      resetModal();
      toast.success('Interview rescheduled successfully.');
    } catch {
      toast.error('Unable to update the interview.');
    }
  };

  const handleSendReminder = (interview) => {
    const confirmed = window.confirm('Send a reminder notification to this candidate?');
    if (!confirmed) return;

    toast.success(`Reminder sent successfully.`);
  };

  const handleCancelInterview = async (interview) => {
    const confirmed = window.confirm('Cancel this interview?');
    if (!confirmed) return;

    try {
      await api.put(`/interviews/${interview._id}`, { status: 'cancelled' });
      setInterviews((prev) => prev.map((item) => (item._id === interview._id ? { ...item, status: 'cancelled' } : item)));
      toast.success('Interview canceled successfully.');
    } catch {
      toast.error('Unable to cancel the interview.');
    }
  };

  const handleViewCv = (interview) => {
    const cvUrl = interview.applicant?.cvUrl || interview.applicant?.resumeUrl || interview.resumeUrl;
    if (cvUrl) {
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No CV uploaded.');
    }
  };

  const handleJoinMeeting = (interview) => {
    const destination = interview.meetingLink || interview.location;
    if (!destination) return;
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-[28px] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#EAF2FE] p-3 text-[#0D5BC4]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0D5BC4]">{t('interviews.dashboardTitle')}</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t('interviews.pipeline')}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('interviews.pipelineSubtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openScheduleModal}
                className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-[#0D5BC4]"
              >
                {t('interviews.scheduleNew')}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title={t('interviews.upcoming')} value={stats.upcoming} subtitle={t('interviews.scheduledInPipeline')} icon={CalendarDays} accent="bg-[#EAF2FE] text-[#0D5BC4]" />
            <MetricCard title={t('interviews.today')} value={stats.today} subtitle={t('interviews.onCalendarToday')} icon={Clock3} accent="bg-sky-50 text-sky-600" />
            <MetricCard title={t('interviews.completed')} value={stats.completed} subtitle={t('interviews.closedSuccessfully')} icon={Award} accent="bg-violet-50 text-violet-600" />
            <MetricCard title={t('interviews.cancelled')} value={stats.cancelled} subtitle={t('interviews.needsFollowUp')} icon={XCircle} accent="bg-rose-50 text-rose-600" />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t('interviews.searchPlaceholder')}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  />
                </label>
                <select
                  aria-label="Filter interviews"
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="Upcoming">{t('interviews.pipeline')}</option>
                  <option value="Completed">{t('interviews.completed')}</option>
                  <option value="Cancelled">{t('interviews.cancelled')}</option>
                  <option value="All">{t('interviews.all')}</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarView((prev) => !prev)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50"
                >
                  {showCalendarView ? t('interviews.hideCalendar') : t('interviews.calendarView')}
                </button>
                <button
                  type="button"
                  onClick={openScheduleModal}
                  className="rounded-full bg-[#1769E0] px-3 py-2 text-sm font-medium text-white transition duration-200 hover:bg-[#0D5BC4]"
                >
                  {t('interviews.newInterview')}
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${activeTab === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                {t('interviews.interviewsShown', { count: filteredInterviews.length })}
              </div>
              <select
                aria-label="Filter by date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none"
              >
                <option value="All">{t('interviews.allDates')}</option>
                <option value="Today">{t('interviews.todayFilter')}</option>
                <option value="Tomorrow">{t('interviews.tomorrowFilter')}</option>
                <option value="This Week">{t('interviews.thisWeekFilter')}</option>
                <option value="This Month">{t('interviews.thisMonthFilter')}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              {t('interviews.loadingPipeline')}
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              {t('interviews.noInterviews')}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedInterviews.map((interview) => {
                const candidateName = `${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim();
                const status = normalizeStatus(interview.status);
                const isCompletedInterview = status === 'completed';
                const evaluationStatus = getEvaluationStatus(interview, t);

                return (
                  <div key={interview._id} className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EAF2FE] text-base font-semibold text-[#0A4FA8]">
                          {interview.applicant?.avatar ? (
                            <img src={interview.applicant.avatar} alt="Candidate" className="h-14 w-14 rounded-full object-cover" />
                          ) : (
                            (interview.applicant?.firstName?.[0] || 'C').toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900">{candidateName || t('interviews.candidate')}</h2>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getStatusBadgeClasses(status)}`}>
                              {status === 'scheduled' ? t('interviews.scheduled') : status === 'completed' ? t('interviews.completed') : status === 'cancelled' || status === 'canceled' ? t('interviews.cancelled') : status}
                            </span>
                            {isCompletedInterview && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {evaluationStatus}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-[#0D5BC4]" />{interview.job?.title || t('interviews.jobPosition')}</span>
                            <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-[#0D5BC4]" />{interview.applicant?.email || 'Email pending'}</span>
                            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[#0D5BC4]" />{interview.applicant?.phone || 'Phone pending'}</span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('interviews.interviewDate')}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{format(new Date(interview.scheduledDate), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('interviews.interviewTime')}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{format(new Date(interview.scheduledDate), 'h:mm a')}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('interviews.duration') || 'Duration'}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{interview.duration || '60 min'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('interviews.interviewType')}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{getInterviewTypeLabel(interview.type, t)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 xl:min-w-[260px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('interviews.meetingLink')}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{getInterviewTypeLabel(interview.type, t)}</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {interview.meetingLink || interview.location || 'Meeting details will be shared soon.'}
                          </p>
                        </div>
                        {isCompletedInterview && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{interview.rating ? `${interview.rating}/5` : t('interviews.pending')}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {['scheduled', 'upcoming'].includes(status) ? (
                            <>
                              <button type="button" aria-label="Start Interview" onClick={() => startInterviewWorkflow(interview)} className="inline-flex items-center gap-2 rounded-full border border-[#1769E0] px-3 py-2 text-sm font-medium text-[#1769E0] transition hover:bg-[#EAF2FE]">
                                <PlayCircle className="h-4 w-4" /> {t('interviews.startInterview')}
                              </button>
                              <button type="button" onClick={() => openEditModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                <SquarePen className="h-4 w-4" /> {t('interviews.reschedule')}
                              </button>
                              <button type="button" onClick={() => handleCancelInterview(interview)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50">
                                <XCircle className="h-4 w-4" /> {t('common.cancel')}
                              </button>
                            </>
                          ) : null}

                          {isCompletedInterview ? (
                            <>
                              <button type="button" onClick={() => openFeedbackModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                <FileText className="h-4 w-4" /> {t('interviews.notes')}
                              </button>
                              <button type="button" onClick={() => openAssessmentDetailsModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                <Star className="h-4 w-4" /> {t('interviews.evaluationSummary')}
                              </button>
                              <button type="button" onClick={() => openAssessmentModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50">
                                <Star className="h-4 w-4" /> {t('interviews.completeAssessment')}
                              </button>
                            </>
                          ) : null}

                          {status === 'cancelled' || status === 'canceled' ? (
                            <button type="button" onClick={() => openEditModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                              <SquarePen className="h-4 w-4" /> {t('interviews.reschedule')}
                            </button>
                          ) : null}

                          <button type="button" onClick={() => openDetailsModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                            <Eye className="h-4 w-4" /> {t('common.view')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> {t('common.previous')}
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition ${page === pageNumber ? 'bg-[#1769E0] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showCalendarView && (
          <aside className="w-full space-y-4 overflow-x-auto xl:max-w-[340px] xl:overflow-visible">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t('interviews.monthlyCalendar')}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{format(new Date(), 'MMMM yyyy')}</h3>
                </div>
                <span className="rounded-full bg-[#EAF2FE] px-3 py-1 text-sm font-medium text-[#0A4FA8]">{t('interviews.live')}</span>
              </div>
              <div className="mt-5 grid min-w-[280px] grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="mt-3 grid min-w-[280px] grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, index) => {
                  const day = index - 4;
                  const date = new Date();
                  date.setDate(date.getDate() + day);
                  const key = date.toDateString();
                  const isInterviewDay = calendarDates.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`flex h-9 w-full items-center justify-center rounded-xl text-sm font-medium transition sm:h-10 ${isInterviewDay ? 'bg-[#1769E0] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{t('interviews.typeSummaryTitle')}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">{interviews.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {typeSummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{t('interviews.upcomingReminders')}</h3>
                <span className="text-sm text-slate-500">{upcomingReminders.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {upcomingReminders.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    <p className="font-semibold text-slate-900">{t('interviews.noUpcomingReminders')}</p>
                    <p className="mt-2">{t('interviews.notifyApproaching')}</p>
                  </div>
                ) : upcomingReminders.map((interview) => {
                  const candidateName = `${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim() || t('interviews.candidate');
                  const scheduledDate = new Date(interview.scheduledDate);
                  const reminderStatus = getReminderStatus(scheduledDate);
                  const reminderText = getReminderText(scheduledDate);
                  const reminderMeta = getReminderMeta(scheduledDate, interview.job?.title);

                  return (
                    <div key={interview._id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className={`mt-1 h-3 w-3 rounded-full ${reminderStatus.color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900">{candidateName}</p>
                          <p className="mt-1 text-sm text-slate-600">{reminderText}</p>
                          <p className="mt-2 text-sm font-medium text-slate-500">{reminderMeta}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-2xl border border-[#A8C8F5] bg-[#EAF2FE] p-4">
                <h4 className="text-sm font-semibold text-[#083D82]">{t('interviews.stayOrganized')}</h4>
                <p className="mt-1 text-sm text-[#0A4FA8]">{t('interviews.keepSynced')}</p>
                <button
                  type="button"
                  onClick={() => toast.success(t('interviews.reminderEnabledSuccess') || 'Reminder enabled.')}
                  className="mt-3 rounded-full bg-[#1769E0] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#0D5BC4]"
                >
                  {t('interviews.enableReminder')}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {showWorkflow && selectedInterview && (
        <div className="mt-8">
          {workflowStep === 1 && (
            <PreInterviewLobby
              interview={selectedInterview}
              onReschedule={() => { toast.success('Reschedule flow opened.'); }}
              onStartInterview={() => setWorkflowStep(2)}
              onBack={resetModal}
            />
          )}
          {workflowStep === 2 && (
            <InterviewRoom
              interview={selectedInterview}
              notes={workflowNotes}
              onNotesChange={setWorkflowNotes}
              onSaveNotes={handleWorkflowSaveNotes}
              onFinishInterview={handleWorkflowFinish}
              onBack={() => setWorkflowStep(1)}
            />
          )}
          {workflowStep === 3 && (
            <InterviewEvaluation
              interview={selectedInterview}
              form={workflowForm}
              onChange={setWorkflowForm}
              onSaveDraft={() => toast.success('Draft saved locally.')}
              onSubmit={handleWorkflowSubmit}
              onBack={() => setWorkflowStep(2)}
            />
          )}
          {workflowStep === 4 && (
            <InterviewRoundProgress
              interview={selectedInterview}
              onScheduleLastInterview={() => { toast.success('Last interview scheduled.'); setWorkflowStep(5); }}
              onBack={() => setWorkflowStep(3)}
            />
          )}
          {workflowStep === 5 && (
            <InterviewCompletedSummary
              interview={selectedInterview}
              evaluation={workflowForm}
              onViewProfile={() => toast.success('Candidate profile opened.')}
              onBack={resetModal}
              onShareFeedback={() => toast.success('Feedback shared with team.')}
              onNextStage={() => { toast.success('Candidate moved to the next stage.'); setWorkflowStep(6); }}
            />
          )}
          {workflowStep === 6 && (
            <HiringDecisionHub
              interview={selectedInterview}
              onBack={resetModal}
            />
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Schedule Interview</h3>
                <p className="mt-1 text-sm text-slate-600">Choose the applicant, time, meeting format, and notes.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            {scheduledSummary ? (
              <div className="mt-6 rounded-3xl border border-[#A8C8F5] bg-[#EAF2FE] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1769E0] text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#083D82]">Interview Scheduled</h3>
                    <p className="text-sm text-[#0A4FA8]">The candidate has been notified of the interview details.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{scheduledSummary.candidateName}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{scheduledSummary.date}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{scheduledSummary.time}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{scheduledSummary.type}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location/Link</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{scheduledSummary.locationOrLink}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={resetModal} className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0D5BC4]">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="candidate" className="mb-2 block text-sm font-medium text-slate-700">Candidate</label>
                  <select
                    id="candidate"
                    value={form.applicationId}
                    onChange={(event) => {
                      const applicationId = event.target.value;
                      setForm((prev) => ({ ...prev, applicationId }));
                      setFormErrors((prev) => ({ ...prev, candidate: undefined }));
                      const selectedCandidate = interviewCandidates.find((candidate) => candidate.applicationId === applicationId);
                      setSelectedApplicantId(selectedCandidate?.userId || '');
                    }}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none ${formErrors.candidate ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}
                    disabled={candidatesLoading || interviewCandidates.length === 0}
                    required
                  >
                    <option value="">Select a candidate</option>
                    {interviewCandidates.map((candidate) => (
                      <option key={candidate.applicationId} value={candidate.applicationId}>
                        {candidate.fullName || 'Candidate'} — {candidate.jobTitle || 'Position'} — {candidate.email || 'No email'}
                      </option>
                    ))}
                  </select>
                  {candidatesLoading ? (
                    <p className="mt-2 text-sm text-slate-500">Loading candidates...</p>
                  ) : candidatesError ? (
                    <p className="mt-2 text-sm text-rose-500">{candidatesError}</p>
                  ) : interviewCandidates.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No shortlisted candidates available.</p>
                  ) : null}
                  {formErrors.candidate && <p className="mt-1.5 text-xs text-rose-600">{formErrors.candidate}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="interview-date" className="mb-2 block text-sm font-medium text-slate-700">Interview Date</label>
                    <input
                      id="interview-date"
                      type="date"
                      min={todayISO}
                      value={form.scheduledDate}
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, scheduledDate: event.target.value }));
                        setFormErrors((prev) => ({ ...prev, date: undefined }));
                      }}
                      placeholder="Select interview date"
                      className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none ${formErrors.date ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}
                      required
                    />
                    {formErrors.date && <p className="mt-1.5 text-xs text-rose-600">{formErrors.date}</p>}
                  </div>
                  <div>
                    <label htmlFor="interview-time" className="mb-2 block text-sm font-medium text-slate-700">Interview Time</label>
                    <input
                      id="interview-time"
                      type="time"
                      value={form.scheduledTime}
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, scheduledTime: event.target.value }));
                        setFormErrors((prev) => ({ ...prev, time: undefined }));
                      }}
                      placeholder="Select interview time"
                      className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none ${formErrors.time ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}
                      required
                    />
                    {formErrors.time && <p className="mt-1.5 text-xs text-rose-600">{formErrors.time}</p>}
                    {form.scheduledTime && !formErrors.time && (
                      <p className="mt-1.5 text-xs font-medium text-[#0A4FA8]">Selected time: {formatTimeValue(form.scheduledTime)}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Choose the date and time when you want to interview this candidate.</p>

                <div>
                  <label htmlFor="interview-type" className="mb-2 block text-sm font-medium text-slate-700">Interview Type</label>
                  <select
                    id="interview-type"
                    value={form.interviewType}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, interviewType: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, type: undefined, locationOrLink: undefined }));
                    }}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none ${formErrors.type ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}
                    required
                  >
                    <option value="">Select interview type</option>
                    <option value="In-person">In-Person</option>
                    <option value="Video">Online</option>
                  </select>
                  {formErrors.type && <p className="mt-1.5 text-xs text-rose-600">{formErrors.type}</p>}
                </div>

                <div>
                  <label htmlFor="interview-location" className="mb-2 block text-sm font-medium text-slate-700">Location / Meeting Link</label>
                  <input
                    id="interview-location"
                    type="text"
                    value={form.locationOrLink}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, locationOrLink: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, locationOrLink: undefined }));
                    }}
                    placeholder={form.interviewType === 'Video' ? 'https://meet.google.com/...' : form.interviewType === 'In-person' ? 'Conference room / office location' : 'Select interview type above'}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-sm outline-none ${formErrors.locationOrLink ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}
                    required
                  />
                  {formErrors.locationOrLink && <p className="mt-1.5 text-xs text-rose-600">{formErrors.locationOrLink}</p>}
                </div>

                <div>
                  <label htmlFor="interview-notes" className="mb-2 block text-sm font-medium text-slate-700">Invitation Notes</label>
                  <textarea
                    id="interview-notes"
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows="3"
                    placeholder="Share prep notes or reminders with the candidate"
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={resetModal} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                    {submitting ? 'Saving...' : 'Save Interview'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Feedback & Notes</h3>
                <p className="mt-1 text-sm text-slate-600">Capture interviewer notes or candidate feedback.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <form onSubmit={handleFeedbackSave} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows="3"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="Add interviewer feedback"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows="3"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="Add internal follow-up notes"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetModal} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssessmentModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Complete Assessment</h3>
                <p className="mt-1 text-sm text-slate-600">Capture evaluation notes, rating, strengths, weaknesses, and final decision.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <form onSubmit={handleAssessmentSave} className="mt-6 space-y-4">
              <div>
                <label htmlFor="assessment-notes" className="mb-2 block text-sm font-medium text-slate-700">Interview Notes</label>
                <textarea
                  id="assessment-notes"
                  value={assessmentForm.notes}
                  onChange={(event) => setAssessmentForm((prev) => ({ ...prev, notes: event.target.value }))}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="Add detailed recruiter feedback"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Candidate Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAssessmentForm((prev) => ({ ...prev, rating: star }))}
                      className={`rounded-full p-1 ${assessmentForm.rating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-600">{assessmentForm.rating ? `${assessmentForm.rating}/5` : 'Select a rating'}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="strengths" className="mb-2 block text-sm font-medium text-slate-700">Strengths</label>
                  <input
                    id="strengths"
                    type="text"
                    value={assessmentForm.strengths}
                    onChange={(event) => setAssessmentForm((prev) => ({ ...prev, strengths: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    placeholder="Strong React skills, communication"
                  />
                </div>
                <div>
                  <label htmlFor="weaknesses" className="mb-2 block text-sm font-medium text-slate-700">Weaknesses</label>
                  <input
                    id="weaknesses"
                    type="text"
                    value={assessmentForm.weaknesses}
                    onChange={(event) => setAssessmentForm((prev) => ({ ...prev, weaknesses: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    placeholder="Needs more testing depth"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="final-decision" className="mb-2 block text-sm font-medium text-slate-700">Mark Final Decision</label>
                <select
                  id="final-decision"
                  value={assessmentForm.finalDecision}
                  onChange={(event) => setAssessmentForm((prev) => ({ ...prev, finalDecision: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                >
                  <option value="Pending Evaluation">Pending Evaluation</option>
                  <option value="Passed">Passed</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetModal} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssessmentDetailsModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Assessment Summary</h3>
                <p className="mt-1 text-sm text-slate-600">Read-only review of the submitted interview evaluation.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900"><FileText className="h-4 w-4" /> Interview Notes</div>
                <p className="mt-2">{selectedInterview.feedback || selectedInterview.note || 'No notes recorded yet.'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900"><Star className="h-4 w-4" /> Rating</div>
                <p className="mt-2">{selectedInterview.rating ? `${selectedInterview.rating}/5` : 'No rating recorded yet.'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><ThumbsUp className="h-4 w-4" /> Strengths</div>
                  <p className="mt-2">{selectedInterview.strengths || 'No strengths recorded yet.'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><ThumbsDown className="h-4 w-4" /> Weaknesses</div>
                  <p className="mt-2">{selectedInterview.weaknesses || 'No weaknesses recorded yet.'}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900"><Award className="h-4 w-4" /> Final Decision</div>
                <p className="mt-2">{selectedInterview.finalDecision || formatResultLabel(selectedInterview.result) || 'Pending Evaluation'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Interview Details</h3>
                <p className="mt-1 text-sm text-slate-600">Complete interview overview for this candidate.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold text-slate-900">Candidate:</span> {`${selectedInterview.applicant?.firstName || ''} ${selectedInterview.applicant?.lastName || ''}`.trim()}</div>
              <div><span className="font-semibold text-slate-900">Email:</span> {selectedInterview.applicant?.email || 'Not provided'}</div>
              <div><span className="font-semibold text-slate-900">Phone:</span> {selectedInterview.applicant?.phone || 'Not provided'}</div>
              <div><span className="font-semibold text-slate-900">Position:</span> {selectedInterview.job?.title || 'Applied position'}</div>
              <div><span className="font-semibold text-slate-900">Interview Type:</span> {getInterviewTypeLabel(selectedInterview.type)}</div>
              <div><span className="font-semibold text-slate-900">Interview Date:</span> {selectedInterview.scheduledDate ? format(new Date(selectedInterview.scheduledDate), 'MMM d, yyyy') : 'Not scheduled'}</div>
              <div><span className="font-semibold text-slate-900">Interview Time:</span> {selectedInterview.scheduledDate ? format(new Date(selectedInterview.scheduledDate), 'h:mm a') : 'Not scheduled'}</div>
              <div><span className="font-semibold text-slate-900">Meeting / Location:</span> {selectedInterview.meetingLink || selectedInterview.location || 'To be confirmed'}</div>
              <div><span className="font-semibold text-slate-900">Employer Notes:</span> {selectedInterview.note || 'No notes added yet.'}</div>
              <div><span className="font-semibold text-slate-900">Current Status:</span> {selectedInterview.status || 'scheduled'}</div>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Update Meeting Details</h3>
                <p className="mt-1 text-sm text-slate-600">Set the meeting link for online interviews or the location for in-person interviews.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <form onSubmit={handleLinkSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{(selectedInterview.type || '').toLowerCase().includes('zoom') || (selectedInterview.type || '').toLowerCase().includes('meet') || (selectedInterview.type || '').toLowerCase().includes('video') || (selectedInterview.type || '').toLowerCase().includes('online') ? 'Google Meet / Zoom URL' : 'Office Location'}</label>
                <input
                  type="text"
                  value={linkForm.locationOrLink}
                  onChange={(event) => setLinkForm((prev) => ({ ...prev, locationOrLink: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder={((selectedInterview.type || '').toLowerCase().includes('zoom') || (selectedInterview.type || '').toLowerCase().includes('meet') || (selectedInterview.type || '').toLowerCase().includes('video') || (selectedInterview.type || '').toLowerCase().includes('online')) ? 'https://meet.google.com/...' : 'Conference Room A'}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetModal} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Reschedule Interview</h3>
                <p className="mt-1 text-sm text-slate-600">Update the date, time, and meeting location.</p>
              </div>
              <button type="button" onClick={resetModal} className="text-sm font-medium text-slate-500">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                  <input
                    type="date"
                    value={editForm.scheduledDate}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Time</label>
                  <input
                    type="time"
                    value={editForm.scheduledTime}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, scheduledTime: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Meeting Link / Office Location</label>
                <input
                  type="text"
                  value={editForm.locationOrLink}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, locationOrLink: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="Google Meet, Zoom, or office location"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetModal} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerInterviews;
