import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Reviewed', label: 'Under Review' },
  { value: 'Shortlisted', label: 'Shortlisted' },
  { value: 'Interview', label: 'Interview Scheduled' },
  { value: 'Selected', label: 'Offer Sent' },
  { value: 'Hired', label: 'Hired' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Not Selected', label: 'Not Selected' },
];

const SORT_OPTIONS = [
  { value: '-matchScore', label: 'Best Match' },
  { value: '-appliedAt', label: 'Newest applications' },
  { value: 'appliedAt', label: 'Oldest applications' },
  { value: 'status', label: 'Status' },
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

const getStatusLabel = (status) => {
  const option = STATUS_OPTIONS.find((item) => item.value === status);
  return option ? option.label : status || 'Submitted';
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

const ViewApplicants = () => {
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const { applications = [], loading, pagination } = useSelector((state) => state.employer);
  const { user } = useSelector((state) => state.auth);

  const [selectedJobId, setSelectedJobId] = useState(jobId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('-matchScore');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Applicant List</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900">Applicant List</h1>
            <p className="mt-1 text-sm text-slate-600">Review candidates for your posted roles and schedule interviews.</p>
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
                placeholder="Search applicants..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
                aria-label="Search applicants"
              />
            </div>

            <select
              value={selectedJobId}
              onChange={(event) => { setSelectedJobId(event.target.value); setPage(1); }}
              className="input w-full flex-1 max-w-none"
              aria-label="Filter by job"
            >
              <option value="all">All Jobs</option>
              {jobOptions.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => { setSelectedStatus(event.target.value); setPage(1); }}
              className="input w-full flex-1 max-w-none"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="input w-full flex-1 max-w-none"
              aria-label="Sort applicants"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-white border border-slate-200'}`}
          >
            <ClipboardList className="h-4 w-4" /> List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-white border border-slate-200'}`}
          >
            <Layers className="h-4 w-4" /> Grid
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            // trigger CSV export (placeholder) — kept client-only
            toast('Exporting CSV...');
          }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <Download className="h-4 w-4" /> Export CSV
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
              <p className="text-sm text-slate-500">{selectedJob ? 'Job Summary' : 'All Jobs'}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{selectedJob ? selectedJob.title : 'All Open Roles'}</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedJob?.company?.name || selectedJob?.company || 'All your active job postings'}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-1 items-center justify-between gap-4 lg:mt-0 lg:flex-initial">
            <div className="hidden w-full lg:flex items-center justify-center">
              <div className="grid grid-cols-4 divide-x divide-emerald-100 text-center w-full max-w-none">
                <div className="px-4">
                  <p className="text-xs text-slate-500">Applications</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.applicationCount}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">Shortlisted</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.shortlisted}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">Interviews</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.interviewScheduled}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">Hired</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.hired}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => selectedJob && window.open(`/jobs/${selectedJob._id}`, '_blank')}
                disabled={!selectedJob}
                className="ml-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                View Job Details
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
          <h2 className="text-2xl font-semibold text-slate-900">No Applicants Yet</h2>
          <p className="max-w-none text-sm text-slate-500">Applicants will appear here once people apply to your posted jobs. Use the filters above to refine your candidate queue.</p>
        </div>
      ) : (
        <div className={`grid w-full gap-6 ${viewMode === 'grid' ? 'xl:grid-cols-3' : 'grid-cols-1'}`}>
          {summary.source.map((application) => {
            const applicant = application.applicant || {};
            const job = application.job || {};
            const skills = Array.isArray(applicant.skills) ? applicant.skills : [];
            const location = applicant.location?.city || applicant.location?.name || applicant.location || 'Not provided';
            const education = Array.isArray(applicant.education) ? applicant.education.join(', ') : applicant.education || application.resumeAnalysis?.education?.join(', ') || 'Not provided';
            const experience = applicant.experience || application.resumeAnalysis?.experienceYears ? `${application.resumeAnalysis.experienceYears} years` : 'Not provided';
            const isNew = Date.now() - new Date(application.appliedAt || application.createdAt).getTime() < 48 * 60 * 60 * 1000;
            const matchScore = application.matchScore || 0;
            const matchTone = getMatchTone(matchScore);
            const resumeUrl = application.resumeUrl || applicant.cv || '';
            const fileName = getFileNameFromUrl(resumeUrl);
            const resumeDate = formatDate(application.appliedAt || application.createdAt);
            const portfolio = createProfileUrl(applicant.portfolioUrl);
            const github = createProfileUrl(applicant.githubUrl);
            const linkedin = createProfileUrl(applicant.linkedinUrl);
            const shortCoverLetter = truncateLines(application.coverLetter || 'No cover letter provided.', 4);
            const coverLetterLines = (application.coverLetter || '').split('\n').filter(Boolean).length;
            const isCoverLetterTruncated = coverLetterLines > 4 || (application.coverLetter || '').length > 220;

            return (
              <article key={application._id} className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="relative">
                  <div className={`absolute right-6 top-6 z-20 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(application.status)}`}>
                    {getStatusLabel(application.status)}
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
                              <h3 className="text-xl font-semibold text-slate-900">{applicant.firstName || 'Candidate'} {applicant.lastName || ''}</h3>
                              {isNew && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">New</span>}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Applied for {job.title || 'Unknown role'}</p>
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{applicant.email || 'Not provided'}</span>
                              <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{applicant.phone || 'Not provided'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-500"><CalendarDays className="h-4 w-4" /> Applied {formatDate(application.appliedAt || application.createdAt)}</div>
                          <div className="flex items-center gap-2 text-slate-500"><MapPin className="h-4 w-4" /> {location}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Education</p>
                          <p className="mt-3 text-sm text-slate-700">{education}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Experience</p>
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
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cover Letter</p>
                              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{shortCoverLetter}</p>
                            </div>
                            {isCoverLetterTruncated && (
                              <button type="button" onClick={() => handleProfileOpen(application)} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Read More</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 lg:col-span-1">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Match</p>
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
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resume</p>
                        <p className="mt-3 text-sm font-semibold text-slate-900">{fileName}</p>
                        <p className="mt-1 text-sm text-slate-500">Uploaded {resumeDate}</p>
                        <p className="mt-1 text-sm text-slate-500">File size: Not available</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`${api.defaults.baseURL}/applications/${application._id}/resume`, '_blank')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                          >
                            <ExternalLink className="h-4 w-4" /> View Resume
                          </button>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Portfolio</p>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                            <span className="font-medium">Website</span>
                            {portfolio ? (
                              <a href={portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                                <Link2 className="h-4 w-4" /> Visit
                              </a>
                            ) : (
                              <span className="text-slate-500">Not Provided</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                            <span className="font-medium">GitHub</span>
                            {github ? (
                              <a href={github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                                <FileText className="h-4 w-4" /> Open
                              </a>
                            ) : (
                              <span className="text-slate-500">Not Provided</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                            <span className="font-medium">LinkedIn</span>
                            {linkedin ? (
                              <a href={linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                                <ExternalLink className="h-4 w-4" /> Open
                              </a>
                            ) : (
                              <span className="text-slate-500">Not Provided</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 lg:col-span-3 lg:sticky lg:bottom-4 lg:z-30 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current status</p>
                        <select
                          value={statusById[application._id] || application.status}
                          onChange={(event) => handleStatusChange(application._id, event.target.value)}
                          className="input mt-2"
                          aria-label="Change application status"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Actions</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleInterviewOpen(application)} className="inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50">
                            <CalendarDays className="h-4 w-4" /> Schedule Interview
                          </button>
                          <button type="button" onClick={() => handleAction(application._id, 'shortlist')} className="inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50">
                            <Star className="h-4 w-4" /> Shortlist
                          </button>
                          <button type="button" onClick={() => handleProfileOpen(application)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
                            <User className="h-4 w-4" /> Full Profile
                          </button>
                          <button type="button" onClick={() => handleAction(application._id, 'hire')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                            <CheckCircle className="h-4 w-4" /> Hire
                          </button>
                          <button type="button" onClick={() => handleAction(application._id, 'reject')} className="inline-flex items-center gap-2 rounded-full border border-rose-600 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-amber-50 p-5 shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-semibold text-slate-900">Employer Notes (Private)</h4>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible only to your team</span>
                    </div>
                    <textarea
                      value={notesById[application._id] || ''}
                      onChange={(event) => setNotesById((prev) => ({ ...prev, [application._id]: event.target.value }))}
                      rows={4}
                      className="textarea mt-4 w-full border-slate-200 bg-amber-50 text-sm text-slate-800"
                      placeholder="Record hiring notes, feedback, or next steps..."
                      aria-label="Private employer notes"
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        disabled={savingNoteId === application._id}
                        onClick={() => handleNoteSave(application._id)}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" /> {savingNoteId === application._id ? 'Saving...' : 'Save Notes'}
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
            >Previous</button>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="btn btn-outline btn-sm"
            >Next</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Full Profile</h2>
                <p className="mt-1 text-sm text-slate-500">{activeProfile.applicant?.firstName} {activeProfile.applicant?.lastName}</p>
              </div>
              <button type="button" onClick={() => setActiveProfile(null)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Applicant</p>
                  <p className="mt-4 text-lg font-semibold text-slate-900">{activeProfile.applicant?.firstName} {activeProfile.applicant?.lastName}</p>
                  <p className="mt-2 text-sm text-slate-500">{activeProfile.applicant?.headline || 'No headline available'}</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {activeProfile.applicant?.email || 'Not provided'}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {activeProfile.applicant?.phone || 'Not provided'}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {activeProfile.applicant?.experience || 'Not provided'}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Skills</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.isArray(activeProfile.applicant?.skills) && activeProfile.applicant.skills.length ? (
                      activeProfile.applicant.skills.map((skill) => (
                        <span key={skill._id || skill} className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">{skill.name || skill}</span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No skills added</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">About</p>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{activeProfile.applicant?.bio || 'No bio available.'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resume</p>
                  <p className="mt-3 text-sm text-slate-700">{getFileNameFromUrl(activeProfile.resumeUrl || activeProfile.applicant?.cv)}</p>
                  <button
                    type="button"
                    onClick={() => window.open(`${api.defaults.baseURL}/applications/${activeProfile._id}/resume`, '_blank')}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" /> View resume
                  </button>
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
