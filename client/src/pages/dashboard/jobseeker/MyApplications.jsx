import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { fetchMyApplications } from '../../../store/slices/applicationSlice';
import { formatRelativeTime } from '../../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiCalendar,
  FiInfo,
  FiSearch,
  FiVideo,
  FiDownload,
  FiMail,
  FiLink,
  FiHome,
  FiBookmark,
  FiUser,
  FiBell,
  FiMessageCircle,
  FiSettings,
  FiHelpCircle,
  FiMapPin,
  FiLogOut,
} from 'react-icons/fi';

const MyApplications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { applications, loading, error } = useSelector((state) => state.applications);
  const { user } = useSelector((state) => state.auth);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const safeApplications = Array.isArray(applications) ? applications : [];

  useEffect(() => {
    if (safeApplications.length === 0) {
      setSelectedApp(null);
      return;
    }

    if (!selectedApp) {
      setSelectedApp(safeApplications[0]);
      return;
    }

    const refreshedApp = safeApplications.find((app) => app._id === selectedApp._id);
    if (!refreshedApp) {
      setSelectedApp(safeApplications[0]);
    } else if (refreshedApp !== selectedApp) {
      setSelectedApp(refreshedApp);
    }
  }, [safeApplications, selectedApp]);

  useEffect(() => {
    dispatch(fetchMyApplications());
  }, [dispatch]);

  useEffect(() => {
    let isActive = true;
    const applicationId = selectedApp?._id;

    if (!applicationId) {
      setSelectedInterview(null);
      return;
    }

    const fetchInterviewForApplication = async () => {
      setInterviewLoading(true);
      setSelectedInterview(null);

      try {
        const response = await api.get('/interviews', { params: { application: applicationId } });
        const interviews = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        if (!isActive) return;
        setSelectedInterview(interviews.length > 0 ? interviews[0] : null);
      } catch (err) {
        console.error('Failed to fetch interview for application:', err);
        if (!isActive) return;
        setSelectedInterview(null);
      } finally {
        if (isActive) setInterviewLoading(false);
      }
    };

    fetchInterviewForApplication();

    return () => {
      isActive = false;
    };
  }, [selectedApp]);

  const filteredApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return safeApplications;

    return safeApplications.filter((app) => {
      return (
        app.job?.title?.toLowerCase().includes(term) ||
        app.company?.name?.toLowerCase().includes(term) ||
        app.status?.toLowerCase().includes(term)
      );
    });
  }, [safeApplications, searchTerm]);

  const getStepIndex = (status) => {
    const normalized = `${status || ''}`.toLowerCase();
    if (normalized.includes('submitted')) return 0;
    if (normalized.includes('review')) return 1;
    if (normalized.includes('shortlist')) return 2;
    if (normalized.includes('interview scheduled') || normalized === 'interview') return 3;
    if (normalized.includes('completed')) return 4;
    if (normalized.includes('offer')) return 5;
    if (normalized.includes('hired') || normalized.includes('selected')) return 6;
    return 0;
  };

  const getStatusPill = (status) => {
    const normalized = `${status || ''}`.toLowerCase();
    if (normalized.includes('interview')) return 'bg-sky-50 text-sky-700';
    if (normalized.includes('selected') || normalized.includes('hired') || normalized.includes('offer')) return 'bg-blue-50 text-blue-700';
    if (normalized.includes('rejected') || normalized.includes('not selected')) return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  const getInterviewDate = (app) => {
    return app.interviewDate ? new Date(app.interviewDate) : null;
  };

  const selectedInterviewDate = selectedInterview?.scheduledDate ? new Date(selectedInterview.scheduledDate) : null;
  const interviewCountdown = selectedInterviewDate ? Math.max(selectedInterviewDate - new Date(), 0) : 0;
  const countdownDays = Math.floor(interviewCountdown / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((interviewCountdown / (1000 * 60 * 60)) % 24);

  const allowedInterviewStatuses = ['scheduled', 'confirmed', 'rescheduled', 'completed', 'cancelled'];
  const showInterviewPanel = Boolean(
    selectedInterview && selectedInterview.status && allowedInterviewStatuses.includes(`${selectedInterview.status}`.toLowerCase()),
  );
  const showNoInterviewYet = Boolean(
    selectedApp &&
      !selectedInterview &&
      ['submitted', 'under review', 'shortlisted', 'pending', 'applied'].some((status) =>
        `${selectedApp.status || ''}`.toLowerCase().includes(status),
      ),
  );

  const formatDate = (date) => {
    if (!date) return t('applications.tbd', { defaultValue: 'TBD' });
    try {
      const parsed = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      if (!parsed || Number.isNaN(parsed.getTime())) return t('applications.tbd', { defaultValue: 'TBD' });
      return parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return t('applications.tbd', { defaultValue: 'TBD' });
    }
  };

  const formatInterviewTime = (value) => {
    if (value === undefined || value === null || value === '') return t('applications.tbd', { defaultValue: 'TBD' });
    const raw = typeof value === 'string' ? value.trim() : `${value}`.trim();
    if (!raw || raw === 'null' || raw === 'undefined') return t('applications.tbd', { defaultValue: 'TBD' });
    if (/^\d{1,2}:\d{2}(\s?(am|pm))?$/i.test(raw) || /^\d{1,2}\s?(am|pm)$/i.test(raw)) {
      return raw.toUpperCase();
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return raw;
  };

  const normalizeInterviewType = (type) => {
    const raw = `${type || ''}`.trim().toLowerCase();
    if (raw.includes('phone')) return t('applications.typePhone', { defaultValue: 'Phone' });
    if (raw.includes('in-person') || raw.includes('in person') || raw.includes('onsite')) return t('applications.typeInPerson', { defaultValue: 'In-person' });
    if (raw.includes('zoom') || raw.includes('meet') || raw.includes('video') || raw.includes('online')) return t('applications.typeOnline', { defaultValue: 'Online' });
    return type || t('applications.tbd', { defaultValue: 'TBD' });
  };

  const getPlatformLabel = (link) => {
    if (!link) return '';
    const normalized = `${link}`.toLowerCase();
    if (normalized.includes('google.com')) return t('applications.platformGoogleMeet', { defaultValue: 'Google Meet' });
    if (normalized.includes('zoom.us') || normalized.includes('zoom.com')) return t('applications.platformZoom', { defaultValue: 'Zoom' });
    if (normalized.includes('teams.microsoft.com') || normalized.includes('microsoft.com')) return t('applications.platformTeams', { defaultValue: 'Microsoft Teams' });
    return t('applications.platformOnlineMeeting', { defaultValue: 'Online Meeting' });
  };

  const selectedCompany = selectedApp?.company?.name || t('applications.company');
  const selectedJob = selectedApp?.job?.title || t('applications.role', { defaultValue: 'Role' });
  const selectedMeetingLink = selectedInterview?.meetingLink || '';
  const selectedMeetingLocation = selectedInterview?.location || '';
  const selectedInterviewType = normalizeInterviewType(selectedInterview?.type);
  const selectedInterviewTime = selectedInterview?.interviewTime
    ? formatInterviewTime(selectedInterview.interviewTime)
    : formatInterviewTime(selectedInterview?.scheduledDate);
  const selectedNotes = selectedInterview?.note || selectedApp?.employerNote || '';
  const selectedDocuments = Array.isArray(selectedInterview?.requiredDocuments) ? selectedInterview.requiredDocuments : [];
  const selectedPhoneNumber = selectedInterview?.phoneNumber || selectedInterview?.contactNumber || '';
  const selectedMeetingPlatform = selectedInterviewType === 'Online' ? getPlatformLabel(selectedMeetingLink) : '';

  const applicationStages = [
    'Submitted',
    'Under Review',
    'Shortlisted',
    'Interview Scheduled',
    'Completed',
    'Offer Sent',
    'Hired',
  ];

  const activeStageIndex = applicationStages.findIndex((item) => item.toLowerCase() === (selectedApp?.status || '').toLowerCase());
  const currentStageIndex = activeStageIndex >= 0 ? activeStageIndex : 3;

  const applicationGuide = [
    { label: 'Interview Scheduled', description: 'You have been scheduled for an interview.', tone: 'blue' },
    { label: 'Completed', description: 'Your interview has been completed.', tone: 'slate' },
    { label: 'Offer Sent', description: 'The employer has sent you a job offer.', tone: 'blue' },
    { label: 'Hired', description: 'Congratulations! You have been hired.', tone: 'blue' },
    { label: 'Rejected', description: 'You were not selected for this position.', tone: 'rose' },
    { label: 'Not Selected', description: 'The recruitment process has ended without selection.', tone: 'slate' },
  ];

  const finalStageLabel = ['rejected', 'not selected'].some((value) =>
    `${selectedApp?.status || ''}`.toLowerCase().includes(value),
  )
    ? selectedApp?.status
    : 'Hired';

  const timelineStages = [
    'Submitted',
    'Under Review',
    'Shortlisted',
    'Interview Scheduled',
    'Completed',
    'Offer Sent',
    finalStageLabel,
  ];

  const activeTimelineIndex = Math.min(getStepIndex(selectedApp?.status), timelineStages.length - 1);

  return (
    <div className="mx-auto w-full max-w-6xl min-h-[calc(100vh-64px)] pb-10 px-1 sm:px-0">
      <div className="mb-8 rounded-[18px] bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('applications.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('applications.subtitle')}</p>
          </div>

          <div className="relative w-full max-w-md">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 text-slate-400 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('applications.searchPlaceholder')}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-[18px] bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{t('applications.backlog')}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{t('applications.inReviewCount', { count: filteredApplications.length })}</h2>
              </div>
              <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <FiCalendar className="mr-2 h-4 w-4" /> {t('applications.interviewScheduled')}
              </div>
            </div>

            <div className="grid gap-4 mt-6">
              {filteredApplications.map((app) => {
                const stepIndex = getStepIndex(app.status);
                const interviewDate = getInterviewDate(app);

                return (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    className={`group cursor-pointer rounded-[18px] border p-6 transition-shadow duration-200 ${selectedApp?._id === app._id ? 'border-blue-300 shadow-lg' : 'border-slate-200 hover:shadow-md'}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-xl font-semibold text-slate-700">
                          {app.company?.name?.charAt(0) || 'G'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{app.company?.name || t('applications.company')}</p>
                          <h3 className="text-xl font-semibold text-slate-900 truncate">{app.job?.title || t('dashboard.jobCard.jobTitle')}</h3>
                          <p className="mt-2 text-sm text-slate-500">{app.company?.name || t('applications.company')}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>{t('applications.appliedTime', { time: formatRelativeTime(app.appliedAt) })}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          <FiCalendar className="h-4 w-4" /> {interviewDate ? formatDate(interviewDate) : t('applications.dateTBA')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusPill(app.status)}`}>
                          {app.status || t('dashboard.status.underReview')}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-500">{t('applications.interviewDate')}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{interviewDate ? formatDate(interviewDate) : t('applications.tbd', { defaultValue: 'TBD' })}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-500">{t('applications.interviewTime')}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{formatInterviewTime(app.interviewTime || app.interviewDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiInfo className="h-4 w-4" /> {t('applications.viewApplication')}
                      </button>
                      {(app.status === 'Interview Scheduled' || app.status === 'Interview') && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await api.get('/interviews', { params: { application: app._id } });
                              const interviews = Array.isArray(response.data?.data)
                                ? response.data.data
                                : Array.isArray(response.data)
                                ? response.data
                                : [];
                              const interview = interviews[0];
                              if (!interview) {
                                toast.error(t('applications.interviewNotFound') || 'Interview details not found.');
                                return;
                              }
                              navigate(`/dashboard/interviews/${interview._id}`);
                            } catch (err) {
                              console.error(err);
                              toast.error(t('applications.interviewError') || 'Unable to find interview details.');
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          <FiVideo className="h-4 w-4" /> {t('applications.viewInterview')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toast.success(t('applications.downloadStarted') || 'Download started')}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <FiDownload className="h-4 w-4" /> {t('applications.downloadInvite')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {selectedApp && (
            <>
              <div className="rounded-[18px] bg-white p-6 shadow-sm border border-slate-200">
                {interviewLoading ? (
                  <div className="min-h-[200px] flex items-center justify-center">
                    <p className="text-sm text-slate-500">{t('common.loading')}</p>
                  </div>
                ) : showInterviewPanel ? (
                  <>
                    <div className="rounded-[18px] bg-blue-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">{t('applications.interviewStatus')}</p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">
                            {selectedInterview.status === 'completed'
                              ? t('applications.interviewCompleted')
                              : selectedInterview.status === 'cancelled'
                                ? t('applications.interviewCancelled')
                                : t('applications.interviewScheduledMsg')}
                          </h3>
                        </div>
                        <div className="inline-flex items-center rounded-full bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                          <FiCalendar className="h-4 w-4" /> {selectedInterview.status.charAt(0).toUpperCase() + selectedInterview.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500">{t('applications.company')}</p>
                        <p className="text-base font-semibold text-slate-900">{selectedCompany}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500">{t('applications.position')}</p>
                        <p className="text-base font-semibold text-slate-900">{selectedJob}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-500">{t('applications.interviewDate')}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(selectedInterviewDate)}</p>
                          <p className="text-sm text-slate-500">
                            {selectedInterviewDate ? new Date(selectedInterviewDate).toLocaleDateString(undefined, { weekday: 'long' }) : ''}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-500">{t('applications.interviewTime')}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{selectedInterviewTime}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{selectedMeetingPlatform}</p>
                        </div>
                      </div>

                      {selectedMeetingLink ? (
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FiLink className="h-4 w-4" /> {t('applications.meetingLink')}
                          </div>
                          <a href={selectedMeetingLink} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-blue-700 underline break-all">
                            {selectedMeetingLink}
                          </a>
                        </div>
                      ) : selectedMeetingLocation ? (
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FiMapPin className="h-4 w-4" /> {t('applications.location')}
                          </div>
                          <p className="mt-2 text-sm text-slate-700 break-all">{selectedMeetingLocation}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 space-y-4">
                      {selectedNotes ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-500">{t('applications.employerNotes')}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">{selectedNotes}</p>
                        </div>
                      ) : null}

                      {selectedDocuments.length > 0 ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-500">{t('applications.documentsRequired')}</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-700">
                            {selectedDocuments.map((doc) => (
                              <li key={doc} className="flex items-center gap-2">
                                <FiCheckCircle className="h-4 w-4 text-slate-400" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 grid gap-3">
                      {selectedMeetingLink ? (
                        <button
                          type="button"
                          onClick={() => window.open(selectedMeetingLink, '_blank', 'noopener,noreferrer')}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          <FiVideo className="h-4 w-4" /> {t('applications.joinMeeting')}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toast.success(t('applications.addedToCalendar') || 'Added to calendar')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiCalendar className="h-4 w-4" /> {t('applications.addToCalendar')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const employerId = selectedInterview?.employer?._id || selectedApp?.job?.postedBy?._id || '';
                          const employerEmail = selectedInterview?.employer?.email || selectedApp?.job?.postedBy?.email || '';
                          const params = new URLSearchParams();
                          if (employerId) params.set('recipient', employerId);
                          if (employerEmail) params.set('recipientEmail', employerEmail);
                          navigate(`/dashboard/messages${params.toString() ? `?${params.toString()}` : ''}`);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiClock className="h-4 w-4" /> {t('applications.rescheduleRequest')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const employerId = selectedInterview?.employer?._id || selectedApp?.job?.postedBy?._id || '';
                          const employerEmail = selectedInterview?.employer?.email || selectedApp?.job?.postedBy?.email || '';
                          const params = new URLSearchParams();
                          if (employerId) params.set('recipient', employerId);
                          if (employerEmail) params.set('recipientEmail', employerEmail);
                          navigate(`/dashboard/messages${params.toString() ? `?${params.toString()}` : ''}`);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiMail className="h-4 w-4" /> {t('applications.contactEmployer')}
                      </button>
                    </div>
                  </>
                ) : showNoInterviewYet ? (
                  <div className="rounded-[18px] bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">{t('applications.noInterviewYet')}</p>
                    <p className="mt-2 text-sm text-slate-500">{t('applications.noInterviewYetHint')}</p>
                  </div>
                ) : (
                  <div className="rounded-[18px] bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">{t('applications.interviewDetailsNotAvailable')}</p>
                  </div>
                )}
              </div>

              {showInterviewPanel ? (
                <div className="rounded-[18px] bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white">
                      <FiClock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{t('applications.interviewStartsIn')}</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{countdownDays} {t('applications.days')} {countdownHours} {t('applications.hours')}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MyApplications;
