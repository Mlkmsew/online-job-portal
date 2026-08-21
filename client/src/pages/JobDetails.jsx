import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { sendMessage } from '../services/messageService';
import toast from 'react-hot-toast';
import {
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiArrowLeft,
  FiAlertTriangle,
  FiCheckCircle,
  FiCheck,
  FiShare2,
  FiFlag,
  FiMessageSquare,
  FiDollarSign,
  FiUsers,
  FiAward,
  FiZap,
  FiHeart,
  FiExternalLink,
  FiChevronRight,
  FiTarget,
  FiBookOpen,
  FiLayers,
  FiClock,
} from 'react-icons/fi';

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-[20px] border border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-800 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-gray-900 text-emerald-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  </div>
);

const accentStyles = {
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  rose: 'bg-rose-50 text-rose-600',
};

const SectionCard = ({ icon: Icon, title, subtitle, children, accent = 'emerald' }) => {
  const style = accentStyles[accent] || accentStyles.emerald;
  return (
    <div className="rounded-[24px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};

const JobDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const isJobSeeker = user?.role === 'jobseeker';
  const isEmployer = user?.role === 'employer';
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');
  const [similarAppliedMap, setSimilarAppliedMap] = useState({});
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageEmail, setMessageEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const canUseProfileCV = Boolean(user?.cv);
  const applicantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'Applicant';
  const applicantEmail = user?.email || 'Not provided';
  const applicantPhone = user?.phone || user?.mobile || 'Not provided';

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const detailsRes = await api.get(`/jobs/${id}`);
        setJob(detailsRes.data?.data || detailsRes.data);

        try {
          const similarRes = await api.get(`/jobs/${id}/similar`);
          setSimilarJobs(similarRes.data?.data || []);
        } catch (simErr) {
          console.error('Failed to load similar jobs:', simErr);
        }
      } catch (error) {
        toast.error('Failed to load job details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const isOwner = Boolean(
    isEmployer &&
      job &&
      ((job.postedBy?._id && job.postedBy._id.toString() === user?._id) ||
        (job.postedBy?.toString && job.postedBy.toString() === user?._id))
  );

  const deadlinePassed = job?.applicationDeadline ? new Date(job.applicationDeadline) < new Date() : false;
  const statusBadge = () => {
    if (job?.isUrgent) return { label: 'Urgently Hiring', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (job?.isFeatured) return { label: 'Featured', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    switch (job?.status) {
      case 'paused':
        return { label: 'Paused', color: 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-800' };
      case 'expired':
        return { label: 'Expired', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'closed':
        return { label: 'Closed', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'active':
        return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: job?.status || 'Draft', color: 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-800' };
    }
  };

  const formatChecklist = (value) =>
    value ? value.split('\n').map((line) => line.trim()).filter(Boolean) : [];

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

  const technicalSkills = Array.isArray(job?.skills?.technical)
    ? job.skills.technical
    : typeof job?.skills?.technical === 'string'
      ? job.skills.technical.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const softSkills = Array.isArray(job?.skills?.soft)
    ? job.skills.soft
    : typeof job?.skills?.soft === 'string'
      ? job.skills.soft.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const requirements = formatChecklist(job?.requirements);
  const responsibilities = formatChecklist(job?.responsibilities);
  const benefits = Array.isArray(job?.benefits)
    ? job.benefits
    : typeof job?.benefits === 'string'
      ? job.benefits.split('\n').map((item) => item.trim()).filter(Boolean)
      : [];

  const toggleBookmark = async () => {
    try {
      if (isBookmarked && bookmarkId) {
        await api.delete(`/bookmarks/${bookmarkId}`);
        setIsBookmarked(false);
        setBookmarkId(null);
        toast.success('Job removed from saved jobs.');
      } else {
        const response = await api.post('/bookmarks', { job: job._id });
        setIsBookmarked(true);
        setBookmarkId(response.data.data._id);
        toast.success('Job saved successfully.');
      }
    } catch (error) {
      console.error('Bookmark toggle failed', error);
    }
  };

  const handleVisitorApply = () => {
    toast.error('Please login to apply.');
    navigate('/login');
  };

  const handleCopyJob = () => {
    navigator.clipboard.writeText(`${window.location.origin}/jobs/${job._id}`);
    toast.success('Job link copied to clipboard.');
  };

  const handleSendMessage = () => {
    if (isOwner) {
      toast.success('Edit recruiter info is coming soon.');
      return;
    }
    setMessageEmail(job?.company?.recruiter?.email || job?.company?.email || job?.postedBy?.email || '');
    setMessageContent('');
    setIsMessageModalOpen(true);
  };

  const handleSubmitNewMessage = async (e) => {
    e.preventDefault();
    if (!messageEmail.trim() || !messageContent.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await sendMessage({
        recipientId: messageEmail.trim(),
        content: messageContent.trim(),
      });
      toast.success(t('messages.startSuccess') || 'Conversation started successfully.');
      setIsMessageModalOpen(false);
      setMessageEmail('');
      setMessageContent('');
    } catch (err) {
      console.error('Start conversation failed:', err);
      toast.error(err.response?.data?.message || t('messages.startFailed') || 'Unable to start conversation.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!job) return;
    setIsBookmarked(Boolean(job.isBookmarked));
    if (job.isBookmarked) {
      setBookmarkId(job.isBookmarked === true ? null : job.isBookmarked);
    }
  }, [job]);

  useEffect(() => {
    if (!isAuthenticated || !isJobSeeker || !job) {
      setHasApplied(false);
      setApplicationStatus('');
      setSimilarAppliedMap({});
      return;
    }

    const fetchApplicationStatus = async () => {
      try {
        const response = await api.get('/applications/my', {
          params: { limit: 200 },
        });
        const applications = Array.isArray(response.data?.data) ? response.data.data : [];
        // Build a map of applied jobs for this seeker (used for main + similar jobs)
        const appliedMap = {};
        applications.forEach((application) => {
          const appliedJobId = application.job?._id || application.job;
          if (appliedJobId) appliedMap[appliedJobId.toString()] = application.status || 'Submitted';
        });
        setSimilarAppliedMap(appliedMap);
        const currentId = job._id.toString();
        if (appliedMap[currentId]) {
          setHasApplied(true);
          setApplicationStatus(appliedMap[currentId]);
        } else {
          setHasApplied(false);
          setApplicationStatus('');
        }
      } catch (error) {
        console.error('Failed to load application status', error);
      }
    };

    fetchApplicationStatus();
  }, [isAuthenticated, isJobSeeker, job]);

  const validateResumeFile = (selectedFile) => {
    if (!selectedFile) return '';

    const extension = selectedFile.name?.split('.').pop()?.toLowerCase();
    const isAllowedExtension = ALLOWED_RESUME_EXTENSIONS.includes(extension);
    const isAllowedMimeType = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(selectedFile.type);

    if (!isAllowedExtension && !isAllowedMimeType) {
      return 'Only PDF, DOC, or DOCX files are allowed.';
    }

    if (selectedFile.size > MAX_RESUME_SIZE) {
      return 'Resume file must be 10MB or smaller.';
    }

    return '';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D1624] px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-8 w-1/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-96 animate-pulse rounded-[32px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 text-center">
        <div className="rounded-[24px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
          <FiAlertTriangle className="mx-auto mb-4 h-14 w-14 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-gray-100">Job Not Found</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-gray-400">The job post you are looking for does not exist or has been closed.</p>
          <button onClick={() => navigate('/jobs')} className="rounded-full bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white">
            Back to Browse Jobs
          </button>
        </div>
      </div>
    );
  }



  const headerBadge = statusBadge();
  const applicantCount = job?.applicantsCount ?? job?.applicationsCount ?? job?.applicantCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1624] px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-full px-0 sm:px-4">
        <button
          onClick={() => navigate('/jobs')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1769E0] dark:text-blue-400 transition hover:text-[#1769E0]"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Jobs
        </button>

        <div className="grid gap-8 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)]">
              <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-900/25 dark:via-gray-900 dark:to-[#0D1624] p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${headerBadge.color}`}>
                        {headerBadge.label}
                      </span>
                      {job?.isFeatured && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Featured</span>}
                      {job?.isUrgent && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Urgently Hiring</span>}
                    </div>

                    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm sm:h-24 sm:w-24">
                        {job.company?.logo ? (
                          <img src={job.company.logo} alt={`${job.company.name} logo`} className="h-full w-full object-contain" />
                        ) : (
                          <div className="text-sm font-medium text-slate-500 dark:text-gray-400">Logo</div>
                        )}
                      </div>

                      <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-gray-100 sm:text-4xl">{job.title}</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-base text-slate-600 dark:text-gray-400">
                          <span className="font-semibold text-slate-900 dark:text-gray-100">{job.company?.name || 'Company Name'}</span>
                          {job.company?.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <FiCheckCircle className="h-3.5 w-3.5" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-2"><FiMapPin className="h-4 w-4" />{job.location?.city ? `${job.location.city}, ${job.location.region}` : job.location?.region || 'Location not specified'}</span>
                          <span className="inline-flex items-center gap-2"><FiBriefcase className="h-4 w-4" />{job.jobType || 'Full-time'}</span>
                          {job.workMode && <span className="inline-flex items-center gap-2"><FiLayers className="h-4 w-4" />{job.workMode}</span>}
                          <span className="inline-flex items-center gap-2"><FiCalendar className="h-4 w-4" />Posted {formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isJobSeeker && (
                      <>
                        {hasApplied ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-600"
                          >
                            <FiCheckCircle className="h-4 w-4" />
                            {t('jobs.applied') || 'Applied'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isAuthenticated) {
                                handleVisitorApply();
                              } else {
                                navigate(`/jobs/${id}/apply`);
                              }
                            }}
                            className="rounded-full bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1769E0]/20 transition hover:bg-[#0D5BC4]"
                          >
                            {deadlinePassed ? t('jobs.expired') : t('jobs.applyNow')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              toast.error(t('savedJobs.resumeRequired'));
                              navigate('/login');
                              return;
                            }
                            toggleBookmark();
                          }}
                          className="rounded-full border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-gray-300 transition hover:bg-slate-50 dark:hover:bg-gray-800"
                        >
                          {isBookmarked ? t('dashboard.jobCard.saved') : t('jobs.save')}
                        </button>
                      </>
                    )}
                    <button type="button" onClick={handleCopyJob} className="rounded-full border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-gray-300 transition hover:bg-slate-50 dark:hover:bg-gray-800">
                      {t('jobs.share')}
                    </button>
                  </div>
                </div>

              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <StatCard icon={FiDollarSign} label="Salary" value={job.salary?.min && job.salary?.max ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ${job.salary.currency || 'ETB'}` : job.salary?.isNegotiable ? 'Negotiable' : 'Not specified'} />
                <StatCard icon={FiAward} label="Experience" value={job.experienceLevel || 'Not specified'} />
                <StatCard icon={FiBookOpen} label="Education" value={job.educationRequired || 'Not specified'} />
                <StatCard icon={FiUsers} label="Open Positions" value={job.numberOfPositions || 1} />
                <StatCard icon={FiClock} label="Deadline" value={formatDate(job.applicationDeadline)} />
                <StatCard icon={FiUsers} label="Applicants" value={applicantCount} />
              </div>
            </div>


                    <div className="rounded-[28px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">Job Description</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">A clear view of the role, requirements, and what you can expect.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{job.applicationMethod || 'Portal'}</span>
              </div>

              <div className="space-y-8">
                <SectionCard icon={FiTarget} title="Description" subtitle="Role overview" accent="emerald">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-gray-400">{job.description}</p>
                </SectionCard>

                {technicalSkills.length > 0 && (
                  <SectionCard icon={FiZap} title="Technical Skills" subtitle="Core tools and technologies" accent="emerald">
                    <div className="flex flex-wrap gap-2">
                      {technicalSkills.map((skill) => (
                        <span key={skill} className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {softSkills.length > 0 && (
                  <SectionCard icon={FiUsers} title="Soft Skills" subtitle="Work style and collaboration" accent="sky">
                    <div className="flex flex-wrap gap-2">
                      {softSkills.map((skill) => (
                        <span key={skill} className="rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {requirements.length > 0 && (
                  <SectionCard icon={FiCheckCircle} title="Requirements" subtitle="What you should bring" accent="emerald">
                    <div className="grid gap-3 md:grid-cols-2">
                      {requirements.map((item, index) => (
                        <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-[18px] border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 p-3">
                          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <FiCheck className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-sm leading-6 text-slate-700 dark:text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {responsibilities.length > 0 && (
                  <SectionCard icon={FiTarget} title="Responsibilities" subtitle="What the role will involve" accent="emerald">
                    <div className="grid gap-3 md:grid-cols-2">
                      {responsibilities.map((item, index) => (
                        <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-[18px] bg-slate-50 dark:bg-gray-800 px-4 py-3">
                          <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <FiChevronRight className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-sm leading-6 text-slate-700 dark:text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {benefits.length > 0 && (
                  <SectionCard icon={FiHeart} title="Benefits & Perks" subtitle="Why people love this team" accent="rose">
                    <div className="flex flex-wrap gap-2">
                      {benefits.map((benefit, index) => {
                        const benefitStyles = [
                          'bg-emerald-50 text-emerald-700 border-emerald-200',
                          'bg-sky-50 text-sky-700 border-sky-200',
                          'bg-rose-50 text-rose-700 border-rose-200',
                          'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
                          'bg-amber-50 text-amber-700 border-amber-200',
                          'bg-violet-50 text-violet-700 border-violet-200',
                          'bg-lime-50 text-lime-700 border-lime-200',
                          'bg-indigo-50 text-indigo-700 border-indigo-200',
                        ];
                        const style = benefitStyles[index % benefitStyles.length];
                        return (
                          <span key={benefit} className={`rounded-full border px-3 py-2 text-sm font-semibold ${style}`}>
                            {benefit}
                          </span>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

              </div>
            </div>

            {similarJobs.length > 0 && (
              <div className="rounded-[28px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100">Similar Jobs</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">Other roles that may interest you.</p>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {similarJobs.map((sim) => (
                    <Link key={sim._id} to={`/jobs/${sim._id}`} className="rounded-[22px] border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 p-5 transition hover:-translate-y-0.5 hover:border-[#1769E0] hover:bg-white dark:hover:bg-gray-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-gray-100">{sim.title}</h4>
                          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{sim.company?.name || 'Company'}</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-gray-400">
                          {sim.jobType || 'Full-time'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-2"><FiMapPin className="h-4 w-4" />{sim.location?.city ? `${sim.location.city}, ${sim.location.region}` : sim.location?.region || 'Location'}</span>
                        <span>{sim.salary?.min && sim.salary?.max ? `ETB ${sim.salary.min.toLocaleString()}-${sim.salary.max.toLocaleString()}` : 'Negotiable'}</span>
                      </div>
                      {isJobSeeker && (similarAppliedMap[sim._id] ? (
                        <span className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                          <FiCheckCircle className="h-4 w-4" />
                          {t('jobs.applied') || 'Applied'}
                        </span>
                      ) : (
                        <button type="button" onClick={(e) => { e.preventDefault(); navigate(`/jobs/${sim._id}/apply`); }} className="mt-4 rounded-full bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white">
                          {t('jobs.applyNow') || 'Apply Now'}
                        </button>
                      ))}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
                  {job.company?.logo ? (
                    <img src={job.company.logo} alt={`${job.company.name} logo`} className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-gray-400">Logo</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{job.company?.name || 'Company Name'}</h3>
                    {job.company?.isVerified && <FiCheckCircle className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-gray-400">{job.company?.shortDescription || job.company?.description || 'No company summary available.'}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-gray-400">
                {job.company?.industry && (
                  <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3">
                    <span>Industry</span>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">{job.company.industry}</span>
                  </div>
                )}
                {job.company?.companySize && (
                  <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3">
                    <span>Company Size</span>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">{job.company.companySize}</span>
                  </div>
                )}
                {job.company?.foundedYear && (
                  <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3">
                    <span>Founded</span>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">{job.company.foundedYear}</span>
                  </div>
                )}
                {job.company?.location?.region && (
                  <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3">
                    <span>Location</span>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">{job.company.location.region}</span>
                  </div>
                )}
              </div>

              {job.company?.website && (
                <a href={job.company.website} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1769E0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]">
                  View Company Profile <FiExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Job Summary</h3>
              <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-gray-400">
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Industry</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.company?.industry || 'Software'}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Employment Type</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.jobType || 'Full-time'}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Work Mode</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.workMode || 'On-site'}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Salary</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.salary?.min && job.salary?.max ? `${job.salary.min.toLocaleString()}-${job.salary.max.toLocaleString()}` : 'Negotiable'}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Experience</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.experienceLevel || 'Entry Level'}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Education</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.educationRequired || 'Bachelor'}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Open Positions</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.numberOfPositions || 1}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Deadline</span><span className="font-semibold text-slate-900 dark:text-gray-100">{formatDate(job.applicationDeadline)}</span></div>
                <div className="flex items-center justify-between rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span>Application Method</span><span className="font-semibold text-slate-900 dark:text-gray-100">{job.applicationMethod || 'Portal'}</span></div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
                  {job.postedBy?.avatar ? (
                    <img src={job.postedBy.avatar} alt="Recruiter" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-gray-400">Photo</div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{job.company?.recruiter?.hrManagerName || `${job.postedBy?.firstName || ''} ${job.postedBy?.lastName || ''}`.trim() || 'Recruiter'}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{job.company?.recruiter?.position || 'Recruiter'}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-gray-400">
                {job.company?.recruiter?.email && (
                  <div className="rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span className="font-semibold text-slate-900 dark:text-gray-100">Email:</span> {job.company.recruiter.email}</div>
                )}
                {job.company?.recruiter?.phone && (
                  <div className="rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3"><span className="font-semibold text-slate-900 dark:text-gray-100">Phone:</span> {job.company.recruiter.phone}</div>
                )}
              </div>

              <button type="button" onClick={handleSendMessage} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1769E0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]">
                <FiMessageSquare className="h-4 w-4" /> {isOwner ? 'Edit Recruiter Info' : 'Send Message'}
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Why Join Us?</h3>
              <div className="mt-5 space-y-3 text-sm text-slate-700 dark:text-gray-300">
                {['Learning Opportunities', 'Great Team', 'Competitive Salary', 'Flexible Culture', 'Career Growth'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[16px] bg-slate-50 dark:bg-gray-800 px-3 py-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <FiCheck className="h-3.5 w-3.5" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('messages.startNewConversation') || 'Start a new conversation'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('messages.newConversationSubtitle') || 'Enter the recipient email and your first message.'}</p>
              </div>
              <button type="button" onClick={() => setIsMessageModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">{t('common.cancel')}</button>
            </div>
            <form onSubmit={handleSubmitNewMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.email')}</label>
                <input
                  value={messageEmail}
                  onChange={(e) => setMessageEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                  placeholder="recipient@example.com"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.messages.title')}</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="mt-2 w-full min-h-[150px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                  placeholder={t('messages.typePlaceholder') || 'Write your message here...'}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsMessageModalOpen(false)} className="rounded-full border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSendingMessage} className="rounded-full bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D5BC4] disabled:cursor-not-allowed disabled:bg-[#A8C8F5]">
                  {isSendingMessage ? t('common.loading') : (t('messages.startConversation') || 'Start conversation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
