import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiBriefcase, FiCalendar, FiCheckCircle, FiDollarSign, FiZap, FiShield, FiUser, FiEdit2, FiDownloadCloud, FiUploadCloud, FiChevronRight, FiCheck } from 'react-icons/fi';

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];

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
    return 'Resume file must be 5MB or smaller.';
  }

  return '';
};

const JobApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [isSalaryNegotiable, setIsSalaryNegotiable] = useState(false);
  const [availability, setAvailability] = useState('Immediately');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [useProfileCV, setUseProfileCV] = useState(Boolean(user?.cv));
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState('');
  const [agreeAccurate, setAgreeAccurate] = useState(false);
  const [agreeShare, setAgreeShare] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [portfolioError, setPortfolioError] = useState('');
  const [githubError, setGithubError] = useState('');
  const [linkedinError, setLinkedinError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');
  const [applicationReference, setApplicationReference] = useState('');

  const resumeInputRef = useRef(null);
  const applicantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'Applicant';
  const applicantEmail = user?.email || 'Not provided';
  const applicantPhone = user?.phone || user?.mobile || 'Not provided';
  const applicationDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const validateUrl = (value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer?.files?.[0] || null;
    if (droppedFile) {
      handleResumeFileChange({ target: { files: [droppedFile] } });
    }
  };

  const handleRemoveResume = () => {
    setFile(null);
    setUploadProgress(0);
    setResumeError('');
    setUseProfileCV(Boolean(user?.cv));
  };

  const handleDownloadResume = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = resumePreviewUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLocation = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const parts = [];
      if (value.address) parts.push(value.address);
      if (value.city) parts.push(value.city);
      if (value.region) parts.push(value.region);
      if (value.state) parts.push(value.state);
      if (value.country) parts.push(value.country);
      return parts.filter(Boolean).join(', ');
    }
    return String(value);
  };

  const jobLocation = formatLocation(job?.location) || formatLocation(job?.city) || formatLocation(job?.address) || 'Addis Ababa, Ethiopia';
  const userLocation = formatLocation(user?.location) || formatLocation(user?.city) || formatLocation(user?.region) || formatLocation(user?.address) || 'Addis Ababa, Ethiopia';
  const postedDate = formatDate(job?.createdAt || job?.postedAt || job?.postedDate);
  const deadlineDate = formatDate(job?.deadline || job?.applicationDeadline);

  const steps = [
    { id: 1, label: 'Applicant Information' },
    { id: 2, label: 'Resume' },
    { id: 3, label: 'Cover Letter' },
    { id: 4, label: 'Screening Questions' },
    { id: 5, label: 'Review & Submit' },
  ];

  const activeStep = useMemo(() => {
    if (!file && !useProfileCV) return 2;
    if (coverLetter.length < 150) return 3;
    if (!availability || (!expectedSalary && !isSalaryNegotiable)) return 4;
    return 5;
  }, [file, useProfileCV, coverLetter, availability, expectedSalary, isSalaryNegotiable]);

  const completionPercentage = useMemo(() => {
    let score = 0;
    if (applicantName && applicantEmail && applicantPhone && userLocation) score += 20;
    if (file || useProfileCV) score += 20;
    if (coverLetter.length >= 150) score += 20;
    if (availability && (expectedSalary || isSalaryNegotiable)) score += 20;
    if (agreeAccurate && agreeShare) score += 20;
    return score;
  }, [applicantName, applicantEmail, applicantPhone, userLocation, file, useProfileCV, coverLetter, availability, expectedSalary, isSalaryNegotiable, agreeAccurate, agreeShare]);

  const previewItems = useMemo(() => {
    const items = [
      { title: 'Resume', value: useProfileCV && user?.cv ? user.cvName || 'Profile CV' : file ? file.name : '' },
      { title: 'Expected Salary', value: expectedSalary ? `${expectedSalary} ETB${isSalaryNegotiable ? ' (Negotiable)' : ''}` : isSalaryNegotiable ? 'Negotiable' : '' },
      { title: 'Availability', value: availability || '' },
      { title: 'Portfolio', value: portfolioUrl || '' },
      { title: 'GitHub', value: githubUrl || '' },
      { title: 'LinkedIn', value: linkedinUrl || '' },
      { title: 'Cover Letter', value: coverLetter ? 'Provided' : '' },
    ];
    return items.filter((item) => item.value);
  }, [file, useProfileCV, user, expectedSalary, isSalaryNegotiable, availability, portfolioUrl, githubUrl, linkedinUrl, coverLetter]);

  useEffect(() => {
    if (resumePreviewUrl) {
      return () => URL.revokeObjectURL(resumePreviewUrl);
    }
    return undefined;
  }, [resumePreviewUrl]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const detailsRes = await api.get(`/jobs/${id}`);
        setJob(detailsRes.data?.data || detailsRes.data);
      } catch (err) {
        toast.error('Failed to load job details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    setUseProfileCV(Boolean(user?.cv));
  }, [user?.cv]);

  const handleResumeFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validationError = validateResumeFile(selectedFile);

    if (validationError) {
      setFile(null);
      setUploadProgress(0);
      setResumeError(validationError);
      event.target.value = '';
      toast.error(validationError);
      return;
    }

    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
    }

    setFile(selectedFile);
    setUseProfileCV(false);
    setResumePreviewUrl(URL.createObjectURL(selectedFile));
    setUploadProgress(100);
    setResumeError('');
  };

  const handlePreviewResume = () => {
    if (file && resumePreviewUrl) {
      window.open(resumePreviewUrl, '_blank');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!file && !useProfileCV) {
      errors.resume = 'Please upload a resume or use your profile CV.';
    }

    if (coverLetter.length < 150) {
      errors.coverLetter = 'Cover letter should be at least 150 characters.';
    }

    if (!availability) {
      errors.availability = 'Please select your availability.';
    }

    if (!expectedSalary && !isSalaryNegotiable) {
      errors.expectedSalary = 'Enter a salary amount or select negotiable.';
    }

    if (portfolioUrl && !validateUrl(portfolioUrl)) {
      errors.portfolioUrl = 'Enter a valid URL.';
    }

    if (githubUrl && !validateUrl(githubUrl)) {
      errors.githubUrl = 'Enter a valid GitHub URL.';
    }

    if (linkedinUrl && !validateUrl(linkedinUrl)) {
      errors.linkedinUrl = 'Enter a valid LinkedIn URL.';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return true;
  };

  const handleApply = async (event, skipConfirm = false) => {
    if (event?.preventDefault) event.preventDefault();

    if (!skipConfirm) {
      setShowConfirm(true);
      return;
    }

    if (authLoading) {
      toast.error('Authentication is still loading. Please wait a moment.');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to submit an application.');
      navigate('/login');
      return;
    }

    if (!user?.role || user.role !== 'jobseeker') {
      toast.error('Only job seekers can apply for jobs.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the highlighted fields before submitting.');
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('job', job._id);
      formData.append('coverLetter', coverLetter);
      formData.append('useProfileCV', String(useProfileCV));
      formData.append('expectedSalary', expectedSalary);
      formData.append('isSalaryNegotiable', String(isSalaryNegotiable));
      formData.append('availability', availability);
      formData.append('portfolioUrl', portfolioUrl);
      formData.append('githubUrl', githubUrl);
      formData.append('linkedinUrl', linkedinUrl);
      if (!useProfileCV && file) {
        formData.append('resume', file);
      }

      const response = await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Your application was submitted successfully!');
      setSubmitSuccess(true);
      setHasApplied(true);
      setApplicationStatus('Application Received');
      setApplicationReference(response.data?.reference || `REF-${Date.now().toString().slice(-6)}`);
    } catch (err) {
      console.error(err);
      const apiCode = err?.response?.data?.code;
      if (apiCode === 'UNSUPPORTED_FILE_TYPE') {
        toast.error('Only PDF, DOC, or DOCX files are allowed.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit application.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-8 w-1/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-96 animate-pulse rounded-[32px] border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 text-center">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
          <FiCheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-600" />
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Job Not Found</h2>
          <p className="mb-6 text-sm text-slate-500">The job you are trying to apply for cannot be found.</p>
          <button onClick={() => navigate('/jobs')} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <Link to={`/jobs/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800">
          <FiArrowLeft className="h-4 w-4" /> Back to Job Details
        </Link>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-white bg-white shadow-sm">
                  {job.company?.logo ? (
                    <img src={job.company.logo} alt={`${job.company.name || 'Company'} logo`} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm font-semibold text-emerald-700">{job.company?.name?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Apply Now</p>
                  <h1 className="mt-3 text-3xl font-bold text-slate-900">{job.title}</h1>
                  <p className="mt-2 text-sm text-slate-600">{job.company?.name || 'Company Name'} · {jobLocation}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    {postedDate && <span>Posted on {postedDate}</span>}
                    {deadlineDate && (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">Deadline: {deadlineDate}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{job.status === 'active' ? 'Active' : job.status}</span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">{job.jobType || 'Full-time'}</span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">{job.workMode || 'On-site'}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[1.75fr_0.95fr] xl:items-start">
            <main className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-slate-900">Application Form</h2>
                  <p className="mt-2 text-sm text-slate-500">Complete your application and submit it directly to the employer.</p>
                </div>

                <form onSubmit={handleApply} className="space-y-6">
                  <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Application Progress</p>
                        <p className="mt-2 text-sm text-slate-600">Track your application journey from start to finish.</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{`Step ${activeStep} of ${steps.length}: ${steps[activeStep - 1]?.label}`}</div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {steps.map((step) => {
                        const completed = step.id < activeStep;
                        const current = step.id === activeStep;
                        return (
                          <div key={step.id} className={`rounded-[18px] border p-3 text-center text-xs font-semibold transition ${completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : current ? 'border-emerald-600 bg-white text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-500'}`}>
                            <div className="mb-1 text-[10px] uppercase tracking-[0.25em]">Step {step.id}</div>
                            <div>{step.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Applicant Information</h3>
                        <p className="mt-1 text-sm text-slate-500">This information is taken from your profile.</p>
                      </div>
                      <Link to="/dashboard/profile" className="inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                        <FiEdit2 className="h-4 w-4" />
                        Edit Profile
                      </Link>
                    </div>
                    <div className="grid gap-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <FiUser className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{applicantName}</p>
                          <p className="text-sm text-slate-600">{applicantEmail}</p>
                          <p className="text-sm text-slate-600">{applicantPhone}</p>
                        </div>
                      </div>
                      <div className="rounded-[18px] bg-white p-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-900">{userLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-[28px] border ${formErrors.resume ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'} p-6 shadow-sm`}>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Resume</h3>
                        <p className="mt-1 text-sm text-slate-500">Drag, drop, or upload your resume. Use your profile CV if available.</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (user?.cv) {
                              setUseProfileCV(true);
                              setFile(null);
                              setUploadProgress(100);
                            }
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${user?.cv ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                          disabled={!user?.cv}
                        >
                          Use Profile CV
                        </button>
                        <button
                          type="button"
                          onClick={() => resumeInputRef.current?.click()}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Upload New Resume
                        </button>
                      </div>
                    </div>
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleResumeFileChange}
                      className="hidden"
                    />
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`rounded-[22px] border-2 border-dashed p-8 text-center transition ${isDragOver ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <FiUploadCloud className="mx-auto h-10 w-10 text-emerald-500" />
                      <p className="mt-4 text-sm font-semibold text-slate-900">Drag & drop your resume here</p>
                      <p className="mt-2 text-sm text-slate-500">PDF, DOC, DOCX · Max 5MB</p>
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                      >
                        <FiChevronRight className="h-4 w-4" />
                        Browse files
                      </button>
                    </div>

                    {user?.cv && useProfileCV ? (
                      <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-900 shadow-sm">
                        <div className="flex items-center gap-3 font-semibold text-emerald-700">
                          <FiCheckCircle className="h-5 w-5" />
                          <span>Profile CV Selected</span>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                          <div>
                            <p className="font-semibold">File Name</p>
                            <p>{user.cvName || 'Profile_CV.pdf'}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Type</p>
                            <p>{user.cvName?.split('.').pop()?.toUpperCase() || 'PDF'}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Size</p>
                            <p>{user.cvSize || '245 KB'}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Upload Date</p>
                            <p>{user.cvUploadedAt ? formatDate(user.cvUploadedAt) : 'Stored in profile'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => resumeInputRef.current?.click()}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm border border-emerald-200 transition hover:bg-emerald-50"
                          >
                            Replace Resume
                          </button>
                        </div>
                      </div>
                    ) : file ? (
                      <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-900 shadow-sm">
                        <div className="flex items-center gap-3 font-semibold text-emerald-700">
                          <FiCheckCircle className="h-5 w-5" />
                          <span>Resume Selected</span>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                          <div>
                            <p className="font-semibold">File Name</p>
                            <p>{file.name}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Type</p>
                            <p>{file.name.split('.').pop()?.toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Size</p>
                            <p>{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <div>
                            <p className="font-semibold">Upload Date</p>
                            <p>{file.lastModified ? formatDate(file.lastModified) : 'Just now'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => resumeInputRef.current?.click()}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm border border-emerald-200 transition hover:bg-emerald-50"
                          >
                            Replace Resume
                          </button>
                          <button
                            type="button"
                            onClick={handlePreviewResume}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 transition hover:bg-slate-50"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadResume}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 transition hover:bg-slate-50"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveResume}
                            className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm border border-rose-200 transition hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <p>Accepted formats: PDF, DOC, DOCX.</p>
                        <p>Maximum size: 5 MB.</p>
                      </div>
                    )}
                    {uploadProgress > 0 && (
                      <div className="mt-4 rounded-full bg-slate-100 p-1">
                        <div className="h-2 rounded-full bg-emerald-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                    {formErrors.resume && <p className="mt-3 text-sm text-rose-600">{formErrors.resume}</p>}
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Cover Letter</h3>
                        <p className="mt-1 text-sm text-slate-500">Introduce yourself and explain why you're a good fit.</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{coverLetter.length} / 1000</span>
                    </div>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setCoverLetter(e.target.value);
                        }
                      }}
                      placeholder="Briefly describe your experience, motivation, and why you're interested in this role."
                      className="min-h-[220px] w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      aria-describedby="cover-letter-help"
                      required
                    />
                    <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <p id="cover-letter-help">Recommended: 150+ characters.</p>
                      <p className="text-slate-400">{coverLetter.length < 150 ? 'Aim for more detail for higher impact.' : 'Good length for a strong application.'}</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-5 text-lg font-semibold text-slate-900">Screening Questions</h3>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <label className="space-y-3">
                        <span className="text-sm font-semibold text-slate-700">Expected Salary</span>
                        <div className="flex rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2">
                          <span className="mr-2 self-center text-sm font-semibold text-slate-600">ETB</span>
                          <input
                            type="number"
                            min="0"
                            value={expectedSalary}
                            onChange={(e) => setExpectedSalary(e.target.value)}
                            className="w-full bg-transparent text-sm text-slate-900 outline-none"
                            placeholder="Amount"
                            aria-label="Expected salary"
                          />
                        </div>
                      </label>
                      <label className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSalaryNegotiable}
                          onChange={(e) => setIsSalaryNegotiable(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">Negotiable</span>
                      </label>
                      <label className="space-y-3">
                        <span className="text-sm font-semibold text-slate-700">Availability</span>
                        <select
                          value={availability}
                          onChange={(e) => setAvailability(e.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                        >
                          <option>Immediately</option>
                          <option>Within 2 Weeks</option>
                          <option>Within 1 Month</option>
                          <option>Negotiable</option>
                        </select>
                      </label>
                      <label className="space-y-3">
                        <span className="text-sm font-semibold text-slate-700">Portfolio / Website</span>
                        <input
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                          placeholder="https://"
                        />
                      </label>
                      <label className="space-y-3">
                        <span className="text-sm font-semibold text-slate-700">GitHub Profile</span>
                        <input
                          type="url"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                          placeholder="https://github.com/your-username"
                        />
                      </label>
                      <label className="space-y-3 lg:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">LinkedIn Profile</span>
                        <input
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                          placeholder="https://www.linkedin.com/in/your-name"
                        />
                      </label>
                    </div>
                  </div>

                  <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <FiCheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Application Summary</p>
                        <p className="text-sm text-slate-500">Please review your application details before submitting.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {[
                        ['Job', job.title],
                        ['Company', job.company?.name || 'Company'],
                        ['Applicant', `${applicantName} (${applicantEmail})`],
                        ['Resume', useProfileCV && user?.cv ? user.cvName || 'Profile CV' : file ? file.name : 'Not Provided'],
                        ['Expected Salary', expectedSalary || 'Not Provided'],
                        ['Availability', availability],
                        ['Portfolio', portfolioUrl || 'Not Provided'],
                        ['Applied Via', 'Ethio Job Portal'],
                        ['Date', applicationDate],
                      ].map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[110px_1fr] gap-4 rounded-[14px] bg-white px-4 py-3 text-sm shadow-sm">
                          <span className="font-semibold text-slate-600">{label}</span>
                          <span className="text-slate-700 break-words">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <label className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={agreeAccurate}
                        onChange={(e) => setAgreeAccurate(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>I certify that all information is accurate.</span>
                    </label>
                    <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={agreeShare}
                        onChange={(e) => setAgreeShare(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>I agree to share my resume with this employer.</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-emerald-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={applying || !agreeAccurate || !agreeShare}
                  >
                    {applying ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Application →'
                    )}
                  </button>
                  {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                      <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
                      <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-10 shadow-lg max-h-[90vh] min-h-[45vh] overflow-auto">
                        <h3 className="text-2xl font-semibold text-slate-900">Confirm submission</h3>
                        <p className="mt-4 text-base leading-relaxed text-slate-700">By submitting, your resume and profile will be shared with <span className="font-semibold">{job.company?.name || 'the company'}</span>. Applications cannot be edited after submission.</p>
                        <div className="mt-8 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowConfirm(false)}
                            className="rounded-full px-5 py-3 text-base font-semibold border border-slate-200 bg-white text-slate-700"
                          >
                            No, cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowConfirm(false);
                              handleApply(undefined, true);
                            }}
                            disabled={applying}
                            className="rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white"
                          >
                            {applying ? 'Submitting...' : 'Yes, submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-center text-sm text-slate-500">Estimated completion time: Less than one minute.</p>

                  {submitSuccess && (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                      Application submitted successfully! You may stay on this page or visit your applications page later.
                    </div>
                  )}
                </form>
              </section>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Application Preview</h3>
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <FiUser className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Applicant</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{applicantName}</p>
                      <p className="mt-1 text-sm text-slate-600">{applicantEmail}</p>
                      <p className="text-sm text-slate-600">{applicantPhone}</p>
                      <p className="mt-2 text-sm text-slate-600">{userLocation}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      title: 'Resume',
                      value: useProfileCV && user?.cv ? user.cvName || 'Profile CV' : file ? file.name : 'Not provided',
                      icon: <FiBriefcase className="h-5 w-5" />,
                    },
                    {
                      title: 'Expected Salary',
                      value: expectedSalary ? `${expectedSalary} ETB${isSalaryNegotiable ? ' (Negotiable)' : ''}` : 'Not provided',
                      icon: <FiDollarSign className="h-5 w-5" />,
                    },
                    {
                      title: 'Availability',
                      value: availability || 'Not provided',
                      icon: <FiCalendar className="h-5 w-5" />,
                    },
                    {
                      title: 'Portfolio',
                      value: portfolioUrl || 'Not provided',
                      icon: <FiZap className="h-5 w-5" />,
                    },
                    {
                      title: 'GitHub',
                      value: githubUrl || 'Not provided',
                      icon: <FiShield className="h-5 w-5" />,
                    },
                    {
                      title: 'LinkedIn',
                      value: linkedinUrl || 'Not provided',
                      icon: <FiMapPin className="h-5 w-5" />,
                    },
                    {
                      title: 'Cover Letter',
                      value: coverLetter ? 'Provided' : 'Not provided',
                      icon: <FiCheckCircle className="h-5 w-5" />,
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600 break-words">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                  <h4 className="text-base font-semibold text-slate-900">What happens next?</h4>
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">1</div>
                      <div>
                        <p className="font-semibold text-slate-900">Your application will be sent to the employer.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">2</div>
                      <div>
                        <p className="font-semibold text-slate-900">Employer will review your application.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">3</div>
                      <div>
                        <p className="font-semibold text-slate-900">You will be notified about the next steps.</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">We respect your privacy and your information is secure with us.</p>
                  </div>
                </div>
                <div className="mt-5 rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-sky-700">Need Help?</p>
                      <p className="mt-1 text-sm text-slate-600">If you face any issues while applying, contact our support team.</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-sm">
                      <FiShield className="h-5 w-5" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-sky-600 bg-white px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    <FiShield className="h-4 w-4" />
                    Contact Support
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApply;
