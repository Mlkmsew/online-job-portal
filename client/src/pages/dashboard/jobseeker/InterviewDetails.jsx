import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiLink,
  FiMapPin,
  FiPaperclip,
  FiUser,
  FiColumns,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import api from '../../../services/api';

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInterview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/interviews/${id}`);
      setInterview(response.data?.data || null);
    } catch (err) {
      console.error('Failed to load interview:', err);
      setError(err.response?.data?.message || 'Unable to load interview details.');
      toast.error(err.response?.data?.message || 'Unable to load interview details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return 'TBD';
    try {
      return new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return 'TBD';
    }
  };

  const formatTime = (value) => {
    if (!value) return 'TBD';
    try {
      return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch {
      return 'TBD';
    }
  };

  const getStatusBadge = (status) => {
    const normalized = `${status || ''}`.toLowerCase();
    if (['interview scheduled', 'interview', 'scheduled interview'].includes(normalized)) return 'bg-amber-100 text-amber-800';
    if (['completed'].includes(normalized)) return 'bg-emerald-100 text-emerald-800';
    if (['cancelled'].includes(normalized)) return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-700';
  };

  const handleOpenMeeting = () => {
    if (!interview?.meetingLink) return;
    window.open(interview.meetingLink, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-44 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <h2 className="text-xl font-semibold">Interview details unavailable</h2>
          <p className="mt-2 text-sm">{error || 'We could not load the interview details.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <div className="mt-4">
            <h1 className="text-3xl font-semibold text-slate-900">Interview Details</h1>
            <p className="mt-2 text-sm text-slate-500">Review your upcoming interview schedule, location, and employer notes.</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadge(interview.status)}`}>
          {interview.status || 'Scheduled'}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">{interview.company?.name || 'Employer'}</p>
              <h2 className="text-2xl font-semibold text-slate-900">{interview.job?.title || 'Interview for Position'}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Date</div>
                <div className="mt-1">{formatDate(interview.scheduledDate)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Time</div>
                <div className="mt-1">{formatTime(interview.scheduledDate)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <div className="text-sm font-semibold text-slate-900">Interview type</div>
              <div className="text-sm text-slate-600">{interview.type || 'Interview'}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-semibold text-slate-900">Location</div>
              <div className="text-sm text-slate-600">{interview.meetingLink || interview.location || 'To be confirmed'}</div>
            </div>
            {interview.instructions && (
              <div className="grid gap-2">
                <div className="text-sm font-semibold text-slate-900">Employer instructions</div>
                <div className="text-sm text-slate-600 whitespace-pre-line">{interview.instructions}</div>
              </div>
            )}
            {interview.note && (
              <div className="grid gap-2">
                <div className="text-sm font-semibold text-slate-900">Notes from employer</div>
                <div className="text-sm text-slate-600 whitespace-pre-line">{interview.note}</div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {interview.meetingLink && (
              <button
                onClick={handleOpenMeeting}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <FiLink className="h-4 w-4" /> Join Meeting
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard/applications')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FiColumns className="h-4 w-4" /> View Applications
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiUser className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Your Recruiter</p>
                <p className="text-sm text-slate-600">{interview.employer?.firstName || 'Employer'} {interview.employer?.lastName || ''}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <FiMail className="h-4 w-4" />
                <span>{interview.employer?.email || 'Email not available'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="h-4 w-4" />
                <span>{interview.company?.name || 'Company details unavailable'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4" />
                <span>{interview.status === 'cancelled' ? 'Interview cancelled' : 'Interview confirmed'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiPaperclip className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Interview materials</p>
                <p className="text-sm text-slate-600">Review any documents or notes shared by the recruiter.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="font-semibold text-slate-900">Interview agenda</div>
                <div className="mt-2">Prepare examples of your experience, questions about the role, and notes for the interview.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="font-semibold text-slate-900">Status reminder</div>
                <div className="mt-2">Keep an eye on your email for any updates or rescheduling requests.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetails;
