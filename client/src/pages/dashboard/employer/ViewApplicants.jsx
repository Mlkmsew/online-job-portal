import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { fetchEmployerApplications } from '../../../store/slices/employerSlice';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  MapPin,
  Search,
  Send,
  Mail,
  Menu,
  Bell,
  MoreHorizontal,
  Star,
  User,
  Users,
  X,
  Clock,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'Submitted', labelKey: 'dashboard.status.submitted' },
  { value: 'Reviewed', labelKey: 'dashboard.status.underReview' },
  { value: 'Shortlisted', labelKey: 'dashboard.status.shortlisted' },
  { value: 'Interview', labelKey: 'dashboard.status.interview' },
  { value: 'Selected', labelKey: 'dashboard.status.selected' },
  { value: 'Hired', labelKey: 'dashboard.status.hired' },
  { value: 'Rejected', labelKey: 'dashboard.status.rejected' },
  { value: 'Not Selected', labelKey: 'dashboard.status.notSelected' },
];

const SORT_OPTIONS = [
  { value: '-matchScore', labelKey: 'employer.applicants.strongMatch' },
  { value: '-appliedAt', labelKey: 'employer.applicants.newest' },
  { value: 'appliedAt', labelKey: 'employer.applicants.oldest' },
  { value: 'status', labelKey: 'interviews.status' },
];

const getStatusStyles = (status) => {
  switch (status) {
    case 'Submitted':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Reviewed':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Shortlisted':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'Interview':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'Selected':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'Hired':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Rejected':
    case 'Not Selected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusLabel = (status, t) => {
  const option = STATUS_OPTIONS.find((item) => item.value === status);
  if (option && t) return t(option.labelKey);
  return status || 'Submitted';
};

const getMatchTone = (score) => {
  if (score >= 80) return { label: 'Strong match', color: 'text-emerald-700', ring: 'stroke-emerald-500' };
  if (score >= 60) return { label: 'Good match', color: 'text-amber-700', ring: 'stroke-amber-500' };
  return { label: 'Below average', color: 'text-rose-700', ring: 'stroke-rose-500' };
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' });
};

const getFileNameFromUrl = (url) => {
  if (!url) return 'Resume';
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const segments = path.split('/').filter(Boolean);
    return segments.length ? decodeURIComponent(segments.at(-1)) : url;
  } catch {
    return url;
  }
};

const truncateLines = (text, lineCount = 4) => {
  if (!text) return '';
  const lines = text.trim().split('\n').filter(Boolean);
  return lines.slice(0, lineCount).join('\n');
};

const createProfileUrl = (url) => {
  const value = url?.trim();
  if (!value) return null;
  return value.startsWith('http') ? value : `https://${value}`;
};

const formatApplicantLocation = (location) => {
  if (!location) return 'Not provided';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const parts = [location.city, location.region, location.address, location.name].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Not provided';
  }
  return 'Not provided';
};

const getApplicantLocation = (applicant = {}) => {
  const location = formatApplicantLocation(applicant.location);
  if (location !== 'Not provided') return location;
  const resumeLocation = applicant.resumeAnalysis?.location;
  if (typeof resumeLocation === 'string' && resumeLocation.trim()) return resumeLocation.trim();
  return 'Not provided';
};

const formatApplicantEducation = (applicant = {}) => {
  if (Array.isArray(applicant.education) && applicant.education.length) {
    return applicant.education
      .map((item) => (typeof item === 'string' ? item : item?.degree || item?.institution))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof applicant.education === 'string' && applicant.education.trim()) return applicant.education;
  if (Array.isArray(applicant.educationDetails) && applicant.educationDetails.length) {
    return applicant.educationDetails
      .map((item) => [item.degree, item.institution].filter(Boolean).join(' — '))
      .filter(Boolean)
      .join(', ');
  }
  const resumeEducation = applicant.resumeAnalysis?.education;
  if (Array.isArray(resumeEducation) && resumeEducation.length) return resumeEducation.join(', ');
  if (typeof resumeEducation === 'string' && resumeEducation.trim()) return resumeEducation;
  return 'Not provided';
};

const getExperienceYears = (application, applicant) =>
  applicant.experienceYears || applicant.resumeAnalysis?.experienceYears || application.resumeAnalysis?.experienceYears;

const getExperienceSummary = (application, applicant) => {
  if (applicant.experience) return applicant.experience;
  const years = getExperienceYears(application, applicant);
  if (years) return `${years} years`;
  if (Array.isArray(applicant.experienceDetails) && applicant.experienceDetails.length) {
    return `${applicant.experienceDetails.length} role${applicant.experienceDetails.length > 1 ? 's' : ''}`;
  }
  return 'Not provided';
};

const getApplicantPortfolio = (application, applicant) => {
  const items = Array.isArray(applicant.portfolio) ? applicant.portfolio : [];
  const github = items.find((p) => /github/i.test(p.label || ''))?.url;
  const linkedin = items.find((p) => /linkedin/i.test(p.label || ''))?.url;
  const website = application.portfolioUrl || applicant.portfolioUrl || items[0]?.url || '';
  return {
    website: createProfileUrl(website),
    github: createProfileUrl(application.githubUrl || applicant.githubUrl || github),
    linkedin: createProfileUrl(application.linkedinUrl || applicant.linkedinUrl || linkedin),
  };
};

const ViewApplicants = () => {
  const { t } = useTranslation();
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const { applications = [], loading, pagination } = useSelector((state) => state.employer);
  const { user } = useSelector((state) => state.auth);

  const [selectedJobId, setSelectedJobId] = useState(jobId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('-matchScore');
  const [searchTerm, setSearchTerm] = useState('');
  // viewMode removed — always use list layout (single column)
  const [page, setPage] = useState(1);
  const [statusById, setStatusById] = useState({});
  const [notesById, setNotesById] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ interviewDate: '', interviewTime: '', interviewLocation: '' });
  const [activeProfile, setActiveProfile] = useState(null);

  useEffect(() => {
    setSelectedJobId(jobId || 'all');
    setPage(1);
  }, [jobId]);

  useEffect(() => {
    dispatch(fetchEmployerApplications({
      job: selectedJobId === 'all' ? undefined : selectedJobId,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      sort: sortBy,
      page,
      limit: 10,
    }));
  }, [dispatch, selectedJobId, selectedStatus, sortBy, page]);

  useEffect(() => {
    const map = {};
    applications.forEach((application) => {
      map[application._id] = application.status || 'Submitted';
    });
    setStatusById(map);
  }, [applications]);

  useEffect(() => {
    const map = {};
    applications.forEach((application) => {
      map[application._id] = application.employerNote || '';
    });
    setNotesById(map);
  }, [applications]);

  const jobOptions = useMemo(() => {
    const jobs = new Map();
    applications.forEach((application) => {
      if (application.job?._id) jobs.set(application.job._id, application.job);
    });
    return Array.from(jobs.values());
  }, [applications]);

  const selectedJob = useMemo(() => {
    if (selectedJobId === 'all') return null;
    return applications.find((application) => application.job?._id === selectedJobId)?.job || null;
  }, [applications, selectedJobId]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((application) => {
      const applicant = application.applicant || {};
      const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim().toLowerCase();
      const email = (applicant.email || '').toLowerCase();
      const jobTitle = (application.job?.title || '').toLowerCase();
      return [name, email, jobTitle].some((value) => value.includes(query));
    });
  }, [applications, searchTerm]);

  const summary = useMemo(() => {
    const source = selectedJob ? filteredApplications.filter((app) => app.job?._id === selectedJob._id) : filteredApplications;
    const applicationCount = source.length;
    const shortlisted = source.filter((app) => app.status === 'Shortlisted').length;
    const interviewScheduled = source.filter((app) => app.status === 'Interview').length;
    const hired = source.filter((app) => app.status === 'Hired').length;
    return { applicationCount, shortlisted, interviewScheduled, hired, source };
  }, [filteredApplications, selectedJob]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setStatusById((prev) => ({ ...prev, [applicationId]: status }));
      toast.success('Status updated successfully');
      dispatch(fetchEmployerApplications({
        job: selectedJobId === 'all' ? undefined : selectedJobId,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        sort: sortBy,
        page,
        limit: 10,
      }));
    } catch (error) {
      toast.error('Unable to update status.');
    }
  };

  const handleNoteSave = async (applicationId) => {
    const status = statusById[applicationId] || applications.find((app) => app._id === applicationId)?.status || 'Submitted';
    const note = notesById[applicationId] || '';

    setSavingNoteId(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status`, { status, note });
      toast.success('Private note saved.');
      dispatch(fetchEmployerApplications({
        job: selectedJobId === 'all' ? undefined : selectedJobId,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        sort: sortBy,
        page,
        limit: 10,
      }));
    } catch (error) {
      toast.error('Unable to save notes.');
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleInterviewOpen = (application) => {
    setInterviewModal(application);
    setInterviewForm({
      interviewDate: application.interviewDate ? new Date(application.interviewDate).toISOString().split('T')[0] : '',
      interviewTime: application.interviewTime || '',
      interviewLocation: application.interviewLocation || '',
    });
  };

  const handleInterviewSubmit = async (event) => {
    event.preventDefault();
    if (!interviewModal) return;
    try {
      await api.post(`/applications/${interviewModal._id}/schedule-interview`, interviewForm);
      toast.success('Interview scheduled successfully');
      setInterviewModal(null);
      setInterviewForm({ interviewDate: '', interviewTime: '', interviewLocation: '' });
      dispatch(fetchEmployerApplications({
        job: selectedJobId === 'all' ? undefined : selectedJobId,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        sort: sortBy,
        page,
        limit: 10,
      }));
    } catch (error) {
      toast.error('Unable to schedule interview.');
    }
  };

  const handleAction = async (applicationId, action) => {
    const mapping = {
      shortlist: `/applications/${applicationId}/shortlist`,
      hire: `/applications/${applicationId}/hire`,
      reject: `/applications/${applicationId}/reject`,
    };
    if (!mapping[action]) return;

    try {
      await api.put(mapping[action]);
      toast.success(`Applicant ${action === 'shortlist' ? 'shortlisted' : action === 'hire' ? 'hired' : 'rejected'}.`);
      dispatch(fetchEmployerApplications({
        job: selectedJobId === 'all' ? undefined : selectedJobId,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        sort: sortBy,
        page,
        limit: 10,
      }));
    } catch (error) {
      toast.error(`Unable to ${action} applicant.`);
    }
  };

  const handleProfileOpen = (application) => {
    setActiveProfile(application);
  };

  const handleViewResume = async (applicationId) => {
    try {
      const response = await api.get(`/applications/${applicationId}/resume`, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(response.data);
      window.open(blobUrl, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to view resume.');
    }
  };

  const renderSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card animate-pulse">
          <div className="h-12 w-1/3 rounded-full bg-slate-200"></div>
          <div className="mt-6 grid gap-4">
            <div className="h-6 rounded bg-slate-200"></div>
            <div className="h-24 rounded bg-slate-200"></div>
            <div className="h-10 rounded bg-slate-200"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full flex-1 max-w-none min-w-0 px-6 py-8">
      {/* Top header */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">{t('employer.applicants.title')}</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900">{t('employer.applicants.title')}</h1>
            <p className="mt-1 text-sm text-slate-600">{t('employer.applicants.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
            <Search className="h-5 w-5" />
          </button>
          <div className="relative">
            <button className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
            </button>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-xs px-1.5 py-0.5">1</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200">
            <img src={user?.avatar || '/images/avatar-placeholder.png'} alt="profile" className="h-8 w-8 rounded-full object-cover" />
            <div className="text-sm">
              <div className="font-medium text-slate-900">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-slate-500">{user?.company || user?.role || 'Employer'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="mt-6 flex w-full items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('employer.applicants.searchPlaceholder')}
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
                aria-label="Search applicants"
              />
            </div>

            <select
              value={selectedJobId}
              onChange={(event) => { setSelectedJobId(event.target.value); setPage(1); }}
              className="input min-w-[160px] md:min-w-[220px]"
              aria-label="Filter by job"
            >
              <option value="all">{t('employer.applicants.allJobs')}</option>
              {jobOptions.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => { setSelectedStatus(event.target.value); setPage(1); }}
              className="input min-w-[140px] md:min-w-[200px]"
              aria-label="Filter by status"
            >
              <option value="all">{t('employer.applicants.allStatuses')}</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{t(status.labelKey)}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="input min-w-[160px] md:min-w-[220px]"
              aria-label="Sort applicants"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List/Grid toggle removed — fixed grid layout */}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            // trigger CSV export (placeholder) — kept client-only
            toast('Exporting CSV...');
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[#1769E0] bg-white px-4 py-2 text-sm font-medium text-[#1769E0] hover:bg-[#EAF2FE]"
        >
          <Download className="h-4 w-4" /> {t('employer.applicants.exportCsv')}
        </button>
      </div>

      {/* Job summary (selected) */}
      <div className="mt-6 w-full rounded-2xl bg-white p-4 shadow-sm border border-emerald-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{selectedJob ? t('common.summary') : t('employer.applicants.allJobs')}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{selectedJob ? selectedJob.title : t('employer.jobs.title')}</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedJob?.company?.name || selectedJob?.company || t('employer.jobs.subtitle')}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-1 items-center justify-between gap-4 lg:mt-0 lg:flex-initial">
            <div className="hidden w-full lg:flex items-center justify-center">
              <div className="grid grid-cols-4 divide-x divide-emerald-100 text-center w-full max-w-none">
                <div className="px-4">
                  <p className="text-xs text-slate-500">{t('dashboard.totalApplicants')}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.applicationCount}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">{t('dashboard.status.shortlisted')}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.shortlisted}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">{t('interviews.pipeline')}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.interviewScheduled}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">{t('dashboard.status.accepted')}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.hired}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => selectedJob && window.open(`/jobs/${selectedJob._id}`, '_blank')}
                disabled={!selectedJob}
                className="ml-4 inline-flex items-center gap-2 rounded-full border border-[#1769E0] bg-white px-4 py-2 text-sm font-medium text-[#1769E0] transition hover:bg-[#EAF2FE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('employer.applicants.viewJobDetails')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        renderSkeleton()
      ) : summary.applicationCount === 0 ? (
        <div className="card mt-8 flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-3xl bg-emerald-50 p-8">
            <Users className="mx-auto h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">{t('employer.applicants.noApplicants')}</h2>
          <p className="max-w-none text-sm text-slate-500">{t('employer.applicants.noApplicantsSub')}</p>
        </div>
      ) : (
        <div className="grid w-full gap-6 grid-cols-1">
          {summary.source.map((application) => {
            const applicant = application.applicant || {};
            const job = application.job || {};
            const skills = Array.isArray(applicant.skills) ? applicant.skills : [];
            const location = getApplicantLocation(applicant);
            const education = formatApplicantEducation(applicant);
            const experience = getExperienceSummary(application, applicant);
            const isNew = Date.now() - new Date(application.appliedAt || application.createdAt).getTime() < 48 * 60 * 60 * 1000;
            const matchScore = application.matchScore || 0;
            const matchTone = getMatchTone(matchScore);
            const resumeUrl = application.resumeUrl || applicant.cv || '';
            const fileName = getFileNameFromUrl(resumeUrl);
            const resumeDate = formatDate(application.appliedAt || application.createdAt);
            const { website: portfolio, github, linkedin } = getApplicantPortfolio(application, applicant);
            const shortCoverLetter = truncateLines(application.coverLetter || 'No cover letter provided.', 4);
            const coverLetterLines = (application.coverLetter || '').split('\n').filter(Boolean).length;
            const isCoverLetterTruncated = coverLetterLines > 4 || (application.coverLetter || '').length > 220;

            return (
              <article key={application._id} className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="relative">
                  <div className={`absolute right-6 top-6 z-20 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(application.status)}`}>
                    {getStatusLabel(application.status, t)}
                  </div>
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-5 lg:col-span-1">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 overflow-hidden">
                            {applicant.avatar ? (
                              <img src={applicant.avatar} alt={`${applicant.firstName || 'Candidate'} avatar`} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-8 w-8" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold text-slate-900">{applicant.firstName || t('interviews.candidate')} {applicant.lastName || ''}</h3>
                              {isNew && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{t('common.new') || 'New'}</span>}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{t('employer.applicants.appliedFor')} {job.title || 'Unknown role'}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{applicant.email || t('employer.applicants.notProvided')}</span>
                              <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{applicant.phone || t('employer.applicants.notProvided')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-500"><CalendarDays className="h-4 w-4" /> {t('employer.applicants.appliedDate')} {formatDate(application.appliedAt || application.createdAt)}</div>
                          <div className="flex items-center gap-2 text-slate-500"><MapPin className="h-4 w-4" /> {location}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.education')}</p>
                          <p className="mt-3 text-sm text-slate-700">{education}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.experience')}</p>
                          <p className="mt-3 text-sm text-slate-700">{experience}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {skills.slice(0, 6).map((skill) => (
                            <span key={skill._id || skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">{skill.name || skill}</span>
                          ))}
                          {skills.length > 6 && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">+{skills.length - 6} more</span>
                          )}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.coverLetter')}</p>
                              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{shortCoverLetter}</p>
                            </div>
                            {isCoverLetterTruncated && (
                              <button type="button" onClick={() => handleProfileOpen(application)} className="text-sm font-semibold text-[#1769E0] hover:text-[#1769E0]">{t('employer.applicants.readMore')}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 lg:col-span-1">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.match')}</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{matchScore}%</p>
                          </div>
                          <div className="relative h-24 w-24 overflow-visible">
                            <svg viewBox="0 0 36 36" className="h-24 w-24">
                              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                              <path
                                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeDasharray={`${matchScore}, 100`}
                                className={`${matchTone.ring}`}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className={`mt-4 text-sm font-medium ${matchTone.color}`}>{matchTone.label}</p>
                        <div className="mt-4 rounded-3xl bg-white p-3 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><Star className="h-4 w-4 text-slate-400" /> Resume Score</div>
                          <div className="mt-2 text-base font-semibold text-slate-900">{matchScore ? `${matchScore}%` : 'No score'}</div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.resume')}</p>
                        <p className="mt-3 text-sm font-semibold text-slate-900">{fileName}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('employer.applicants.uploaded')} {resumeDate}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('employer.applicants.fileSizeNotAvailable')}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewResume(application._id)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#1769E0] hover:text-[#1769E0]"
                          >
                            <ExternalLink className="h-4 w-4" /> {t('employer.applicants.viewResume')}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.portfolio')}</p>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                            <span className="font-medium">{t('employer.applicants.website')}</span>
                            {portfolio ? (
                              <a href={portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#1769E0] hover:text-[#1769E0]">
                                <Link2 className="h-4 w-4" /> {t('employer.applicants.visit')}
                              </a>
                            ) : (
                              <span className="text-slate-500">{t('employer.applicants.notProvided')}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                            <span className="font-medium">{t('employer.applicants.github')}</span>
                            {github ? (
                              <a href={github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#1769E0] hover:text-[#1769E0]">
                                <FileText className="h-4 w-4" /> {t('employer.applicants.open')}
                              </a>
                            ) : (
                              <span className="text-slate-500">{t('employer.applicants.notProvided')}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                            <span className="font-medium">{t('employer.applicants.linkedin')}</span>
                            {linkedin ? (
                              <a href={linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#1769E0] hover:text-[#1769E0]">
                                <ExternalLink className="h-4 w-4" /> {t('employer.applicants.open')}
                              </a>
                            ) : (
                              <span className="text-slate-500">{t('employer.applicants.notProvided')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 lg:col-span-3 lg:sticky lg:bottom-4 lg:z-30 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.currentStatus')}</p>
                        <select
                          value={statusById[application._id] || application.status}
                          onChange={(event) => handleStatusChange(application._id, event.target.value)}
                          className="input mt-2"
                          aria-label="Change application status"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.actions')}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleInterviewOpen(application)} className="inline-flex items-center gap-2 rounded-full border border-[#1769E0] bg-white px-4 py-2 text-sm font-semibold text-[#1769E0] transition hover:bg-[#EAF2FE]">
                            <CalendarDays className="h-4 w-4" /> {t('interviews.scheduleInterview')}
                          </button>
                          <button type="button" onClick={() => handleAction(application._id, 'shortlist')} className="inline-flex items-center gap-2 rounded-full border border-[#1769E0] bg-white px-4 py-2 text-sm font-semibold text-[#1769E0] transition hover:bg-[#EAF2FE]">
                            <Star className="h-4 w-4" /> {t('employer.applicants.shortlist')}
                          </button>
                          <button type="button" onClick={() => handleProfileOpen(application)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#1769E0] hover:text-[#1769E0]">
                            <User className="h-4 w-4" /> {t('employer.applicants.fullProfile')}
                          </button>
                          <button type="button" onClick={() => handleAction(application._id, 'hire')} className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]">
                            <CheckCircle className="h-4 w-4" /> {t('employer.applicants.hire')}
                          </button>
                          <button type="button" onClick={() => handleAction(application._id, 'reject')} className="inline-flex items-center gap-2 rounded-full border border-rose-600 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                            <X className="h-4 w-4" /> {t('employer.applicants.reject')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-amber-50 p-5 shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-semibold text-slate-900">{t('employer.applicants.employerNotesPrivate')}</h4>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('employer.applicants.visibleTeamOnly')}</span>
                    </div>
                    <textarea
                      value={notesById[application._id] || ''}
                      onChange={(event) => setNotesById((prev) => ({ ...prev, [application._id]: event.target.value }))}
                      rows={4}
                      className="textarea mt-4 w-full border-slate-200 bg-amber-50 text-sm text-slate-800"
                      placeholder={t('employer.applicants.notesPlaceholder')}
                      aria-label="Private employer notes"
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        disabled={savingNoteId === application._id}
                        onClick={() => handleNoteSave(application._id)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0D5BC4] disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" /> {savingNoteId === application._id ? t('common.saving') : t('interviews.saveNotes')}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination?.pages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="btn btn-outline btn-sm"
            >{t('common.previous')}</button>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="btn btn-outline btn-sm"
            >{t('common.next')}</button>
          </div>
        </div>
      )}

      {interviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Schedule Interview</h2>
                <p className="mt-1 text-sm text-slate-500">For {interviewModal.applicant?.firstName} {interviewModal.applicant?.lastName}</p>
              </div>
              <button type="button" onClick={() => setInterviewModal(null)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInterviewSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Date</span>
                <input
                  type="date"
                  value={interviewForm.interviewDate}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewDate: event.target.value }))}
                  className="input mt-2"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Time</span>
                <input
                  type="time"
                  value={interviewForm.interviewTime}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewTime: event.target.value }))}
                  className="input mt-2"
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Location or Meeting Link</span>
                <input
                  type="text"
                  value={interviewForm.interviewLocation}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewLocation: event.target.value }))}
                  className="input mt-2"
                  placeholder="Conference room or Zoom link"
                  required
                />
              </label>
              <div className="sm:col-span-2 flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setInterviewModal(null)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/40" role="dialog" aria-modal="true" aria-label={`Full profile for ${activeProfile.applicant?.firstName || ''} ${activeProfile.applicant?.lastName || ''}`}>
          <div className="absolute inset-0 flex items-start justify-center p-4">
            <div className="w-full max-w-5xl h-[90vh] overflow-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200" tabIndex={-1}>
              {/* Header */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 sticky top-0 bg-white z-20">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-900">{activeProfile.applicant?.firstName} {activeProfile.applicant?.lastName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{activeProfile.job?.title || activeProfile.jobTitle || 'Applied Position'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(activeProfile.applicant?.email || ''); }} aria-label="Copy email" className="rounded-md p-2 text-slate-600 hover:bg-slate-50">
                    Copy Email
                  </button>
                  <button type="button" onClick={() => setActiveProfile(null)} aria-label="Close profile" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Candidate Summary */}
                <section className="grid gap-4 md:grid-cols-3 items-start">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center overflow-hidden">
                        {activeProfile.applicant?.avatar ? (
                          <img src={activeProfile.applicant.avatar} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{activeProfile.applicant?.firstName} {activeProfile.applicant?.lastName}</h3>
                        <p className="text-sm text-slate-500">{activeProfile.job?.title || activeProfile.jobTitle || 'Applied Position'}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <div className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> <a href={`mailto:${activeProfile.applicant?.email || ''}`} className="underline">{activeProfile.applicant?.email || 'Not provided'}</a></div>
                          <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> <a href={`tel:${activeProfile.applicant?.phone || ''}`}>{activeProfile.applicant?.phone || 'Not provided'}</a></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Experience</p>
                        <p className="mt-1 text-sm text-slate-800">{activeProfile.applicant?.experience || activeProfile.applicant?.resumeAnalysis?.experienceYears ? `${activeProfile.applicant?.resumeAnalysis?.experienceYears || activeProfile.applicant?.experience} years` : 'Not provided'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Education</p>
                        <p className="mt-1 text-sm text-slate-800">{formatApplicantEducation(activeProfile.applicant)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Location</p>
                        <p className="mt-1 text-sm text-slate-800">{getApplicantLocation(activeProfile.applicant)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Availability</p>
                        <p className="mt-1 text-sm text-slate-800">{activeProfile.applicant?.availability || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills badges */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.isArray(activeProfile.applicant?.skills) && activeProfile.applicant.skills.length ? (
                        activeProfile.applicant.skills.map((skill) => (
                          <span key={skill._id || skill} className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 shadow-sm">{skill.name || skill}</span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No skills provided.</span>
                      )}
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Match Analysis */}
                  <div className="md:col-span-1 rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Match Analysis</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">Overall Match</div>
                        <div className="text-lg font-semibold text-slate-900">{activeProfile.matchScore || 0}%</div>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${activeProfile.matchScore >= 80 ? 'bg-emerald-500' : activeProfile.matchScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${activeProfile.matchScore || 0}%` }} />
                      </div>

                      <div className="mt-4 space-y-3 text-sm text-slate-700">
                        <div>
                          <div className="flex items-center justify-between"><div>Skills</div><div className="font-semibold">{activeProfile.matchScore || 0}%</div></div>
                          <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${activeProfile.matchScore || 0}%` }} /></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between"><div>Experience</div><div className="font-semibold">{activeProfile.resumeAnalysis?.experienceYears ? `${Math.min(100, (activeProfile.resumeAnalysis.experienceYears / 10) * 100).toFixed(0)}%` : '—'}</div></div>
                          <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-amber-400" style={{ width: `${activeProfile.resumeAnalysis?.experienceYears ? Math.min(100, (activeProfile.resumeAnalysis.experienceYears / 10) * 100) : 0}%` }} /></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between"><div>Education</div><div className="font-semibold">{activeProfile.resumeAnalysis?.education?.length ? 'Good' : '—'}</div></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between"><div>Location</div><div className="font-semibold">{activeProfile.applicant?.location ? 'Match' : '—'}</div></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resume & Portfolio */}
                  <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resume</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{getFileNameFromUrl(activeProfile.resumeUrl || activeProfile.applicant?.cv)}</p>
                        <p className="mt-1 text-sm text-slate-500">Uploaded {formatDate(activeProfile.appliedAt || activeProfile.createdAt)} • File size: Not available • Type: PDF</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => window.open(`${api.defaults.baseURL}/applications/${activeProfile._id}/resume`, '_blank')} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">View</button>
                        <button type="button" onClick={() => window.open(`${api.defaults.baseURL}/applications/${activeProfile._id}/resume?download=1`, '_blank')} className="inline-flex items-center gap-2 rounded-md bg-[#1769E0] px-3 py-2 text-sm font-semibold text-white">Download</button>
                        <button type="button" onClick={() => { const w = window.open(`${api.defaults.baseURL}/applications/${activeProfile._id}/resume`, '_blank'); if (w) { w.focus(); setTimeout(() => w.print(), 700); } }} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Print</button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Website</p>
                        {activeProfile.applicant?.portfolioUrl ? <a href={createProfileUrl(activeProfile.applicant.portfolioUrl)} target="_blank" rel="noreferrer" className="text-sm text-[#1769E0]">Visit</a> : <p className="text-sm text-slate-500">Not provided</p>}
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">GitHub</p>
                        {activeProfile.applicant?.githubUrl ? <a href={createProfileUrl(activeProfile.applicant.githubUrl)} target="_blank" rel="noreferrer" className="text-sm text-[#1769E0]">Open</a> : <p className="text-sm text-slate-500">Not provided</p>}
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">LinkedIn</p>
                        {activeProfile.applicant?.linkedinUrl ? <a href={createProfileUrl(activeProfile.applicant.linkedinUrl)} target="_blank" rel="noreferrer" className="text-sm text-[#1769E0]">Open</a> : <p className="text-sm text-slate-500">Not provided</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Experience card */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 md:col-span-2">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Experience</p>
                    <div className="mt-4 space-y-4">
                      {Array.isArray(activeProfile.applicant?.experienceDetails) && activeProfile.applicant.experienceDetails.length ? (
                        activeProfile.applicant.experienceDetails.map((job, idx) => (
                          <div key={idx} className="rounded-lg border border-slate-100 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-900">{job.title || 'Job Title'}</div>
                                <div className="text-sm text-slate-600">{job.company || 'Company'}</div>
                              </div>
                              <div className="text-sm text-slate-500">{job.startDate ? `${formatDate(job.startDate)} — ${job.endDate ? formatDate(job.endDate) : 'Present'}` : 'Period not provided'}</div>
                            </div>
                          </div>
                        ))
                      ) : activeProfile.applicant?.experience ? (
                        <p className="text-sm text-slate-600">{activeProfile.applicant.experience}</p>
                      ) : (
                        <p className="text-sm text-slate-500">No experience provided.</p>
                      )}
                    </div>
                  </div>

                  {/* Education card */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Education</p>
                    <div className="mt-4 space-y-3">
                      {Array.isArray(activeProfile.applicant?.educationDetails) && activeProfile.applicant.educationDetails.length ? (
                        activeProfile.applicant.educationDetails.map((edu, idx) => (
                          <div key={idx}>
                            <div className="font-semibold text-slate-900">{edu.degree || 'Degree'}</div>
                            <div className="text-sm text-slate-600">{edu.institution || 'Institution'}{edu.endDate ? ` • ${edu.endDate}` : ''}</div>
                          </div>
                        ))
                      ) : Array.isArray(activeProfile.applicant?.education) && activeProfile.applicant.education.length ? (
                        activeProfile.applicant.education.map((edu, idx) => (
                          <div key={idx}>
                            <div className="font-semibold text-slate-900">{edu}</div>
                          </div>
                        ))
                      ) : Array.isArray(activeProfile.applicant?.resumeAnalysis?.education) && activeProfile.applicant.resumeAnalysis.education.length ? (
                        activeProfile.applicant.resumeAnalysis.education.map((edu, idx) => (
                          <div key={idx}>
                            <div className="font-semibold text-slate-900">{edu}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Education not provided.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline & Interview & Notes & Rating */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Application Timeline</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                        <div>
                          <div className="font-semibold text-slate-900">Application Submitted</div>
                          <div className="text-xs text-slate-500">{formatDateTime(activeProfile.appliedAt || activeProfile.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                        <div>
                          <div className="font-semibold text-slate-900">Resume Reviewed</div>
                          <div className="text-xs text-slate-500">{activeProfile.updatedAt ? formatDateTime(activeProfile.updatedAt) : '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                        <div>
                          <div className="font-semibold text-slate-900">{activeProfile.status || 'Status'}</div>
                          <div className="text-xs text-slate-500">{formatDateTime(activeProfile.updatedAt || activeProfile.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Interview</p>
                    <div className="mt-4 text-sm text-slate-700">
                      {activeProfile.interviewDate ? (
                        <div className="space-y-2">
                          <div><span className="font-semibold">Date:</span> {formatDate(activeProfile.interviewDate)}</div>
                          <div><span className="font-semibold">Time:</span> {activeProfile.interviewTime || 'Not provided'}</div>
                          <div><span className="font-semibold">Type:</span> {activeProfile.interviewType || 'In-Person'}</div>
                          <div><span className="font-semibold">Status:</span> {activeProfile.interviewStatus || 'Scheduled'}</div>
                          <div><span className="font-semibold">Interviewer:</span> {activeProfile.interviewer || 'Not provided'}</div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No interview scheduled.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Employer Notes</p>
                    <div className="mt-3 space-y-3">
                      {Array.isArray(activeProfile.employerNotes) && activeProfile.employerNotes.length ? (
                        activeProfile.employerNotes.map((n, i) => (
                          <div key={i} className="rounded-lg border border-slate-100 p-3 bg-amber-50">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">{n.author || user?.firstName || 'You'}</div>
                              <div className="text-xs text-slate-500">{n.date ? formatDateTime(n.date) : ''}</div>
                            </div>
                            <div className="mt-2 text-sm text-slate-700">{n.content}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No notes yet. Add a private note.</p>
                      )}

                      <div>
                        <textarea rows={3} placeholder="Add a private note..." className="textarea w-full border-slate-200" id="newNote" aria-label="Add private note" />
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => { const el = document.getElementById('newNote'); if (!el) return; const value = (el.value || '').toString().trim(); if (!value) return; const noteObj = { author: user?.firstName || 'You', date: new Date().toISOString(), content: value }; /* append locally */ if (!Array.isArray(activeProfile.employerNotes)) activeProfile.employerNotes = []; activeProfile.employerNotes.unshift(noteObj); el.value = ''; /* attempt to save via existing API */ handleNoteSave(activeProfile._id); }} className="inline-flex items-center gap-2 rounded-md bg-[#1769E0] px-3 py-2 text-sm font-semibold text-white">Save Note</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating and Actions */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 w-full md:w-1/2">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Candidate Rating</p>
                    <div className="mt-3 space-y-3">
                      {['Communication','Technical Skills','Problem Solving','Culture Fit'].map((label) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className="text-sm text-slate-700">{label}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4" />))}</div>
                            <div className="text-sm text-slate-600">4.0</div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="text-sm font-semibold">Overall</div>
                        <div className="text-lg font-semibold text-slate-900">4.0</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-1/2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current Status</p>
                          <select value={statusById[activeProfile._id] || activeProfile.status} onChange={(e) => handleStatusChange(activeProfile._id, e.target.value)} className="input mt-2" aria-label="Change application status">
                            {['Applied','Under Review','Shortlisted','Interview Scheduled','Interviewed','Offer Sent','Hired','Rejected'].map((s) => (<option key={s} value={s}>{s}</option>))}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleInterviewOpen(activeProfile)} className="inline-flex items-center gap-2 rounded-md border border-[#1769E0] bg-white px-3 py-2 text-sm font-semibold text-[#1769E0]">Schedule Interview</button>
                          <button type="button" onClick={() => { if (window.confirm('Shortlist this candidate?')) handleAction(activeProfile._id,'shortlist'); }} className="inline-flex items-center gap-2 rounded-md border border-[#1769E0] bg-white px-3 py-2 text-sm font-semibold text-[#1769E0]">Shortlist</button>
                          <button type="button" onClick={() => { if (window.confirm('Are you sure you want to hire this candidate?')) handleAction(activeProfile._id,'hire'); }} className="inline-flex items-center gap-2 rounded-md bg-[#1769E0] px-3 py-2 text-sm font-semibold text-white">Hire</button>
                          <button type="button" onClick={() => { if (window.confirm('Are you sure you want to reject this candidate?')) handleAction(activeProfile._id,'reject'); }} className="inline-flex items-center gap-2 rounded-md border border-rose-600 bg-white px-3 py-2 text-sm font-semibold text-rose-600">Reject</button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-right">
                      <button type="button" onClick={() => setActiveProfile(null)} className="text-sm text-slate-600 underline">Close</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplicants;
