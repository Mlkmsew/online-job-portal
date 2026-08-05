import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Award, Bell, CalendarDays, Clock3, Eye, FileText, Link2, MapPin, SquarePen, Star, ThumbsDown, ThumbsUp, XCircle, PlayCircle } from 'lucide-react';
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

const tabs = ['Upcoming', 'Completed', 'Canceled'];

const getTabStatuses = (tab) => {
  switch (tab) {
    case 'Completed':
      return ['completed'];
    case 'Canceled':
      return ['cancelled', 'canceled'];
    default:
      return ['scheduled', 'upcoming'];
  }
};

const getInterviewTypeLabel = (type) => {
  if (!type) return 'In Person';
  const normalizedType = (type || '').toLowerCase();
  if (normalizedType.includes('zoom') || normalizedType.includes('meet') || normalizedType.includes('video') || normalizedType.includes('online')) return 'Online';
  if (normalizedType.includes('phone')) return 'Phone';
  if (normalizedType.includes('in-person') || normalizedType.includes('in person')) return 'In Person';
  return type;
};

const buildInterviewPayload = (form, application) => {
  const scheduledDateTime = new Date(`${form.scheduledDate}T${form.scheduledTime || '09:00'}`);
  const normalizedType = form.interviewType === 'In-Person' ? 'In-person' : form.interviewType === 'Google Meet' || form.interviewType === 'Zoom' ? 'Video' : 'In-person';

  return {
    application: application._id,
    job: application.job?._id || application.job,
    applicant: application.applicant?._id || application.applicant,
    company: application.company?._id || application.company,
    scheduledDate: scheduledDateTime.toISOString(),
    type: normalizedType,
    location: form.locationOrLink,
    meetingLink: form.interviewType === 'Google Meet' || form.interviewType === 'Zoom' ? form.locationOrLink : undefined,
    note: form.notes,
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

const formatResultLabel = (value) => {
  if (!value) return 'Pending';
  const normalized = `${value}`.trim().toLowerCase();
  if (['passed', 'pass', 'hired', 'hire', 'accepted'].includes(normalized)) return 'Hired';
  if (['rejected', 'failed', 'fail', 'no hire', 'not selected'].includes(normalized)) return 'Rejected';
  if (['pending', 'pending evaluation', 'review'].includes(normalized)) return 'Pending';
  return value;
};

const getEvaluationStatus = (interview) => {
  const decision = interview?.finalDecision || interview?.result || interview?.feedback || interview?.rating;
  if (decision) {
    const normalized = `${decision}`.trim().toLowerCase();
    if (['hired', 'hire', 'accepted'].includes(normalized)) return 'Hired';
    if (['passed', 'pass', 'move to next round'].includes(normalized)) return 'Passed';
    if (['rejected', 'failed', 'fail', 'not selected'].includes(normalized)) return 'Rejected';
    if (['pending', 'pending evaluation', 'review'].includes(normalized)) return 'Pending Evaluation';
    return interview.finalDecision || formatResultLabel(interview.result);
  }
  return 'Pending Evaluation';
};

const EmployerInterviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [searchTerm, setSearchTerm] = useState('');
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
    scheduledTime: '09:00',
    interviewType: 'In-Person',
    locationOrLink: '',
    notes: '',
  });
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [resultByInterview, setResultByInterview] = useState({});
  const [editForm, setEditForm] = useState({ scheduledDate: '', scheduledTime: '', locationOrLink: '' });
  const [linkForm, setLinkForm] = useState({ locationOrLink: '' });
  const [assessmentForm, setAssessmentForm] = useState({ notes: '', rating: 0, strengths: '', weaknesses: '', finalDecision: 'Pending Evaluation' });
  const [workflowForm, setWorkflowForm] = useState({ notes: '', rating: '', strengths: '', weaknesses: '', recommendation: '', finalDecision: '' });
  const [workflowNotes, setWorkflowNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [interviewsResponse, applicationsResponse] = await Promise.all([
        api.get('/interviews'),
        api.get('/applications/employer'),
      ]);

      setInterviews(Array.isArray(interviewsResponse.data?.data) ? interviewsResponse.data.data : []);
      setApplications(Array.isArray(applicationsResponse.data?.data) ? applicationsResponse.data.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const shortlistedCandidates = useMemo(() => {
    return applications.filter((application) => {
      const status = (application.status || '').toLowerCase();
      return status.includes('shortlist') || status.includes('interview') || status === 'selected';
    });
  }, [applications]);

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const allowedStatuses = getTabStatuses(activeTab);

    return interviews.filter((interview) => {
      const status = (interview.status || '').toLowerCase();
      const matchesTab = allowedStatuses.includes(status);
      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      const candidateName = `${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim().toLowerCase();
      const jobTitle = (interview.job?.title || '').toLowerCase();
      return candidateName.includes(normalizedSearch) || jobTitle.includes(normalizedSearch);
    });
  }, [activeTab, interviews, searchTerm]);

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
    setForm({
      applicationId: '',
      scheduledDate: '',
      scheduledTime: '09:00',
      interviewType: 'In-Person',
      locationOrLink: '',
      notes: '',
    });
    setFeedback('');
    setNotes('');
    setEditForm({ scheduledDate: '', scheduledTime: '', locationOrLink: '' });
    setLinkForm({ locationOrLink: '' });
    setAssessmentForm({ notes: '', rating: 0, strengths: '', weaknesses: '', finalDecision: 'Pending Evaluation' });
  };

  const openScheduleModal = () => {
    resetModal();
    setShowModal(true);
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
    const selectedApplication = applications.find((application) => application._id === form.applicationId);
    if (!selectedApplication) return;

    setSubmitting(true);
    try {
      const payload = buildInterviewPayload(form, selectedApplication);
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

      toast.success(`Invitation email/notification sent to ${selectedApplication.applicant?.email || 'the candidate'}.`);
      resetModal();
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
    <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Interviews</h1>
          <p className="mt-2 text-gray-600">Manage your candidate interviews, notes, and follow-ups in one place.</p>
        </div>
        <button
          type="button"
          onClick={openScheduleModal}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          Schedule New Interview
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Shortlisted for Interview</h2>
            <p className="mt-1 text-sm text-slate-600">Select from these candidates when scheduling a new interview.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {shortlistedCandidates.length === 0 ? (
              <span className="rounded-full bg-white px-3 py-2 text-sm text-slate-500">No shortlisted candidates yet</span>
            ) : (
              shortlistedCandidates.slice(0, 4).map((application) => (
                <span key={application._id} className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  {`${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim() || 'Candidate'}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by candidate or job title"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-0 lg:max-w-sm"
        />
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Loading interviews...
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          No interviews match this view yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {filteredInterviews.map((interview) => {
            const candidateName = `${interview.applicant?.firstName || ''} ${interview.applicant?.lastName || ''}`.trim();
            const statusTone =
              (interview.status || 'scheduled').toLowerCase() === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : (interview.status || 'scheduled').toLowerCase() === 'cancelled' || (interview.status || 'scheduled').toLowerCase() === 'canceled'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700';
            const evaluationStatus = getEvaluationStatus(interview);
            const isCompletedInterview = (interview.status || '').toLowerCase() === 'completed';
            const evaluationTone = evaluationStatus === 'Pending Evaluation'
              ? 'bg-slate-100 text-slate-700'
              : evaluationStatus === 'Hired' || evaluationStatus === 'Passed'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700';

            return (
              <div key={interview._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  <button type="button" onClick={() => openDetailsModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Eye className="h-4 w-4" /> View Details
                  </button>
                  {!isCompletedInterview && (
                    <>
                      <button type="button" onClick={() => openEditModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <SquarePen className="h-4 w-4" /> Reschedule
                      </button>
                      <button type="button" onClick={() => handleSendReminder(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Bell className="h-4 w-4" /> Reminder
                      </button>
                      <button type="button" onClick={() => handleCancelInterview(interview)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">
                        <XCircle className="h-4 w-4" /> Cancel
                      </button>
                      <button type="button" onClick={() => handleJoinMeeting(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Link2 className="h-4 w-4" /> Update Link
                      </button>
                      <button type="button" onClick={() => openFeedbackModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <FileText className="h-4 w-4" /> Notes
                      </button>
                      <button type="button" aria-label="Start Interview" onClick={() => startInterviewWorkflow(interview)} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                        <PlayCircle className="h-4 w-4" /> Start Interview
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => handleViewCv(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <FileText className="h-4 w-4" /> View CV
                  </button>
                  {isCompletedInterview && (
                    <>
                      <button type="button" onClick={() => openAssessmentModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50">
                        <Star className="h-4 w-4" /> Complete Assessment
                      </button>
                      <button type="button" onClick={() => openAssessmentDetailsModal(interview)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <FileText className="h-4 w-4" /> View Assessment
                      </button>
                    </>
                  )}
                  <select
                    value={resultByInterview[interview._id] || formatResultLabel(interview.result) || 'Pending'}
                    onChange={(event) => handleResultChange(interview._id, event.target.value)}
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
                      <Award className="h-3.5 w-3.5" /> Final Decision: {interview.finalDecision || formatResultLabel(interview.result) || 'Pending Evaluation'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

            <form onSubmit={handleScheduleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="candidate" className="mb-2 block text-sm font-medium text-slate-700">Candidate</label>
                <select
                  id="candidate"
                  value={form.applicationId}
                  onChange={(event) => setForm((prev) => ({ ...prev, applicationId: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  required
                >
                  <option value="">Select a candidate</option>
                  {applications.map((application) => (
                    <option key={application._id} value={application._id}>
                      {`${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim() || 'Candidate'} — {application.job?.title || 'Position'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Time</label>
                  <input
                    type="time"
                    value={form.scheduledTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, scheduledTime: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Interview Type</label>
                <select
                  value={form.interviewType}
                  onChange={(event) => setForm((prev) => ({ ...prev, interviewType: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Location / Meeting Link</label>
                <input
                  type="text"
                  value={form.locationOrLink}
                  onChange={(event) => setForm((prev) => ({ ...prev, locationOrLink: event.target.value }))}
                  placeholder="Conference room A or https://meet.google.com"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Invitation Notes</label>
                <textarea
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
