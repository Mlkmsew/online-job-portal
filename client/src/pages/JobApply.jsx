import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiBriefcase, FiCalendar, FiCheckCircle, FiDollarSign, FiZap, FiShield, FiUser, FiEdit2, FiDownloadCloud, FiUploadCloud, FiChevronRight, FiCheck, FiChevronDown, FiTrash2, FiFile } from 'react-icons/fi';

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

const formatPhoneInput = (raw) => {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    return `+251${digits.replace(/^251/, '').slice(0, 9)}`;
  }
  const digits = cleaned.replace(/\D/g, '');
  return `09${digits.replace(/^0?9?/, '').slice(0, 8)}`;
};

const getScreeningRestriction = (label) => {
  const text = String(label || '').toLowerCase();
  if (text.includes('phone') || text.includes('mobile') || text.includes('telephone') || text.includes('contact')) {
    return {
      maxLength: 13,
      pattern: /^(\+251\d{9}|09\d{8})$/,
      hint: 'Invalid phone number.',
    };
  }
  if (text.includes('portfolio') || text.includes('github') || text.includes('linkedin') || text.includes('link') || text.includes('website')) {
    return { maxLength: 20, optional: true };
  }
  if (text.includes('name')) {
    return { maxLength: 13 };
  }
  return null;
};

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\s+/g, ' ')
    .trim();

const resumeToTextLines = (resume) => {
  const lines = [];
  const push = (value) => {
    const text = escapePdfText(value);
    if (text) lines.push(text);
  };

  const profile = resume?.profile || {};
  push([profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' '));
  push([profile.jobTitle, profile.headline].filter(Boolean).join(' - '));
  push([profile.email, profile.phone].filter(Boolean).join(' | '));
  push([profile.city, profile.address].filter(Boolean).join(', '));
  if (resume?.summary) push(resume.summary);

  const addSection = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    lines.push(title.toUpperCase());
    items.forEach((item) => {
      if (typeof item === 'string') {
        push(item);
      } else if (item && typeof item === 'object') {
        const heading = [
          item.role || item.position || item.degree || item.title,
          item.company || item.institution || item.organization,
          item.startDate,
          item.endDate,
          item.level,
        ].filter(Boolean).join(' - ');
        push(heading);
        push(item.description || item.summary || item.details);
      }
    });
  };

  addSection('EXPERIENCE', resume?.experience);
  addSection('EDUCATION', resume?.education);
  addSection('PROJECTS', resume?.projects);
  addSection('CERTIFICATIONS', resume?.certifications);
  addSection('LANGUAGES', resume?.languages);

  const skills = resume?.skills;
  if (skills) {
    lines.push('SKILLS');
    if (Array.isArray(skills)) {
      skills.forEach((s) => push(typeof s === 'string' ? s : s?.name || s?.skill));
    } else if (typeof skills === 'object' && skills !== null) {
      Object.entries(skills).forEach(([key, value]) => {
        const list = Array.isArray(value) ? value.join(', ') : String(value ?? '');
        if (list.trim()) push(`${key}: ${list}`);
      });
    }
  }

  return lines;
};

const createTextPdf = (textLines, title = 'Resume') => {
  const streamContent = `BT
/F1 11 Tf
50 780 Td
15 TL
${textLines.map((line) => `(${line}) Tj\nT*`).join('\n')}
ET`;
  const objects = [];
  let offset = 0;

  const write = (obj) => {
    const body = `${obj}\n`;
    objects.push({ offset, body });
    offset += body.length;
  };

  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  write('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  write('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  write(`4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  write('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  objects.forEach((o) => {
    xref += `${String(o.offset).padStart(10, '0')} 00000 n \n`;
  });
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const pdf = `%PDF-1.4\n${objects.map((o) => o.body).join('')}${xref}${trailer}`;
  return new File([pdf], `${title.replace(/[^\w-]+/g, '_') || 'Resume'}.pdf`, { type: 'application/pdf' });
};

const formatResumeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const JobApply = () => {
  const { t } = useTranslation();
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
  const [applicationFieldAnswers, setApplicationFieldAnswers] = useState({});
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
  const [isResumeMenuOpen, setIsResumeMenuOpen] = useState(false);
  const [builderCVs, setBuilderCVs] = useState([]);
  const [activeBuilderCV, setActiveBuilderCV] = useState(null);

  const resumeInputRef = useRef(null);
  const submittingRef = useRef(false);
  const resumeMenuRef = useRef(null);
  const resumeStorageKey = `ethiojob_resumes_${user?._id || user?.id || user?.email || localStorage.getItem('token') || 'guest'}`;
  const activeCVStorageKey = `ethiojob_active_cv_${user?._id || user?.id || user?.email || localStorage.getItem('token') || 'guest'}`;
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

  // Employer-configured application fields/questions, normalized with a stable
  // id per field. `required` comes straight from the employer's job config.
  const jobApplicationFields = useMemo(() => {
    const raw = Array.isArray(job?.applicationFields) ? job.applicationFields : [];
    return raw
      .map((field, index) => ({
        _id: field._id || `_field_${index}`,
        label: String(field.label || '').trim(),
        type: field.type || 'text',
        required: !!field.required,
      }))
      .filter((field) => field.label);
  }, [job]);

  const steps = [
    { id: 1, label: 'Applicant Information' },
    { id: 2, label: 'Resume' },
    { id: 3, label: 'Cover Letter' },
    { id: 4, label: 'Screening Questions' },
    { id: 5, label: 'Review & Submit' },
  ];

  const [activeStep, setActiveStep] = useState(1);

  const stepCompletion = useMemo(
    () => [
      Boolean(applicantName && applicantEmail && applicantPhone && userLocation),
      Boolean(file || useProfileCV),
      coverLetter.length >= 150,
      Boolean((expectedSalary || isSalaryNegotiable) && availability) &&
        jobApplicationFields.every(
          (field) =>
            !field.required ||
            getScreeningRestriction(field.label)?.optional ||
            String(applicationFieldAnswers[field._id] || '').trim()
        ),
      Boolean(agreeAccurate && agreeShare),
    ],
    [
      applicantName,
      applicantEmail,
      applicantPhone,
      userLocation,
      file,
      useProfileCV,
      coverLetter,
      expectedSalary,
      isSalaryNegotiable,
      availability,
      jobApplicationFields,
      applicationFieldAnswers,
      agreeAccurate,
      agreeShare,
    ]
  );

  useEffect(() => {
    const firstIncomplete = stepCompletion.findIndex((done) => !done);
    const targetStep = firstIncomplete === -1 ? steps.length : firstIncomplete + 1;
    setActiveStep((prev) => Math.max(prev, targetStep));
  }, [stepCompletion, steps.length]);

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

    if (user?.role && user.role !== 'jobseeker') {
      navigate(`/jobs/${id}`);
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

    const fetchApplicationStatus = async () => {
      try {
        const response = await api.get('/applications/my', {
          params: { job: id, limit: 1 },
        });
        const applications = Array.isArray(response.data?.data) ? response.data.data : [];
        const application = applications.find((a) => (a.job?._id || a.job)?.toString() === id.toString()) || null;
        if (application) {
          setHasApplied(true);
          setApplicationStatus(application.status || 'Submitted');
        }
      } catch (err) {
        console.error('Failed to load application status', err);
      }
    };

    fetchJobDetails();
    fetchApplicationStatus();
  }, [id, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    setUseProfileCV(Boolean(user?.cv));
  }, [user?.cv]);

  useEffect(() => {
    if (!isResumeMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (resumeMenuRef.current && !resumeMenuRef.current.contains(event.target)) {
        setIsResumeMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isResumeMenuOpen]);

  useEffect(() => {
    const loadBuilderCVs = () => {
      try {
        const stored = localStorage.getItem(resumeStorageKey);
        const legacyStored = localStorage.getItem('ethiojob_resumes');
        const parsed = stored ? JSON.parse(stored) : legacyStored ? JSON.parse(legacyStored) : [];
        setBuilderCVs(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        setBuilderCVs([]);
      }
    };

    loadBuilderCVs();
    window.addEventListener('storage', loadBuilderCVs);
    return () => window.removeEventListener('storage', loadBuilderCVs);
  }, [resumeStorageKey]);

  useEffect(() => {
    const loadActiveBuilderCV = () => {
      try {
        const activeStored = localStorage.getItem(activeCVStorageKey);
        setActiveBuilderCV(activeStored ? JSON.parse(activeStored) : null);
      } catch (error) {
        setActiveBuilderCV(null);
      }
    };

    loadActiveBuilderCV();
    window.addEventListener('storage', loadActiveBuilderCV);
    return () => window.removeEventListener('storage', loadActiveBuilderCV);
  }, [activeCVStorageKey]);

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

  const handleSelectBuilderCV = (resume) => {
    setIsResumeMenuOpen(false);
    if (!resume) return;
    try {
      const pdfFile = createTextPdf(resumeToTextLines(resume), resume?.title || 'Resume');
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
      }
      setFile(pdfFile);
      setUseProfileCV(false);
      setResumePreviewUrl(URL.createObjectURL(pdfFile));
      setUploadProgress(100);
      setResumeError('');
      toast.success(`Resume "${resume?.title || 'Untitled'}" selected.`);
    } catch (error) {
      console.error('Failed to generate resume PDF from builder CV:', error);
      toast.error('Could not use this builder CV as a resume.');
    }
  };

  const handleUseProfileCV = () => {
    setIsResumeMenuOpen(false);
    if (user?.cv) {
      setUseProfileCV(true);
      setFile(null);
      setUploadProgress(100);
    } else if (activeBuilderCV) {
      handleSelectBuilderCV(activeBuilderCV);
    } else {
      toast.error('No profile CV found. Please upload a CV in your profile first.');
      navigate('/dashboard/profile');
    }
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

    jobApplicationFields.forEach((field) => {
      const value = String(applicationFieldAnswers[field._id] || '').trim();
      const errorKey = `field_${field._id}`;
      const restriction = getScreeningRestriction(field.label);
      const isRequired = field.required && !restriction?.optional;
      if (isRequired && !value) {
        errors[errorKey] = 'This field is required.';
      } else if (value && field.type === 'url' && !validateUrl(value)) {
        errors[errorKey] = 'Enter a valid URL.';
      } else if (value && restriction?.pattern && !restriction.pattern.test(value)) {
        errors[errorKey] = restriction.hint;
      }
    });

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

    if (hasApplied) {
      toast.error('You have already applied for this job.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the highlighted fields before submitting.');
      return;
    }

    // Prevent double submissions (e.g. rapid double-clicks on the confirm button)
    if (submittingRef.current) return;
    submittingRef.current = true;
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
      if (jobApplicationFields.length > 0) {
        const screeningAnswersPayload = jobApplicationFields.map((field) => ({
          fieldId: field._id,
          question: field.label,
          answer: String(applicationFieldAnswers[field._id] || '').trim(),
        }));
        formData.append('screeningAnswers', JSON.stringify(screeningAnswersPayload));
      }
      if (!useProfileCV && file) {
        formData.append('resume', file);
      }

      const response = await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipGlobalErrorToast: true,
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
      submittingRef.current = false;
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
          <FiCheckCircle className="mx-auto mb-4 h-14 w-14 text-blue-600" />
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Job Not Found</h2>
          <p className="mb-6 text-sm text-slate-500">The job you are trying to apply for cannot be found.</p>
          <button onClick={() => navigate('/jobs')} className="rounded-full bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <Link to={`/jobs/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1769E0] transition hover:text-[#1769E0]">
          <FiArrowLeft className="h-4 w-4" /> Back to Job Details
        </Link>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] border border-white bg-white shadow-sm">
                  {job.company?.logo ? (
                    <img src={job.company.logo} alt={`${job.company.name || 'Company'} logo`} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm font-semibold text-blue-700">{job.company?.name?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Apply Now</p>
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
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{job.status === 'active' ? 'Active' : job.status}</span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">{job.jobType || 'Full-time'}</span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">{job.workMode || 'On-site'}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[1.75fr_0.95fr] xl:items-start">
            <main className="space-y-6">
              {hasApplied ? (
                <section className="rounded-[28px] border border-blue-200 bg-blue-50 p-8 shadow-sm">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <FiCheckCircle className="h-8 w-8" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-blue-800">You have already applied for this job.</h2>
                      <p className="mt-2 text-sm text-blue-700">
                        {applicationStatus ? `Status: ${applicationStatus}` : 'Your application has been submitted successfully.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs/${id}`)}
                      className="rounded-full border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Back to Job Details
                    </button>
                  </div>
                </section>
              ) : (
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
                          <div key={step.id} className={`rounded-[18px] border p-3 text-center text-xs font-semibold transition ${completed ? 'border-blue-200 bg-blue-50 text-blue-700' : current ? 'border-blue-600 bg-white text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-500'}`}>
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
                      <Link to="/dashboard/profile" className="inline-flex items-center gap-2 rounded-full border border-[#1769E0] bg-[#EAF2FE] px-4 py-2 text-sm font-semibold text-[#1769E0] transition hover:bg-[#DCEAFD]">
                        <FiEdit2 className="h-4 w-4" />
                        Edit Profile
                      </Link>
                    </div>
                    <div className="grid gap-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
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
                          onClick={handleUseProfileCV}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${useProfileCV ? 'bg-[#1769E0] text-white hover:bg-[#0D5BC4]' : 'border border-[#1769E0] bg-white text-[#1769E0] hover:bg-[#EAF2FE]'}`}
                        >
                          Use Profile CV
                        </button>
                        <div className="relative" ref={resumeMenuRef}>
                          <button
                            type="button"
                            onClick={() => setIsResumeMenuOpen((o) => !o)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            aria-haspopup="menu"
                            aria-expanded={isResumeMenuOpen}
                          >
                            Upload New Resume
                            <FiChevronDown className={`h-4 w-4 transition ${isResumeMenuOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isResumeMenuOpen && (
                            <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setIsResumeMenuOpen(false);
                                  resumeInputRef.current?.click();
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50"
                              >
                                <FiUploadCloud className="h-4 w-4 text-[#1769E0]" />
                                Upload New Resume
                              </button>
                              {builderCVs.length > 0 && (
                                <>
                                  <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Resume Builder
                                  </div>
                                  {builderCVs.map((resume) => (
                                    <button
                                      key={resume?.id || resume?._id || resume?.title}
                                      type="button"
                                      role="menuitem"
                                      onClick={() => handleSelectBuilderCV(resume)}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-blue-50"
                                    >
                                      <FiFile className="h-4 w-4 shrink-0 text-[#1769E0]" />
                                      <span className="min-w-0 flex-1 truncate">{resume?.title || 'Untitled CV'}</span>
                                      {resume?.updatedAt || resume?.createdAt ? (
                                        <span className="shrink-0 text-xs text-slate-400">
                                          {formatResumeDate(resume.updatedAt || resume.createdAt)}
                                        </span>
                                      ) : null}
                                    </button>
                                  ))}
                                  <div className="mx-4 my-1 border-t border-slate-100" />
                                </>
                              )}
                              <button
                                type="button"
                                role="menuitem"
                                onClick={handleUseProfileCV}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-blue-50"
                              >
                                <FiUser className="h-4 w-4 text-[#1769E0]" />
                                Use Profile CV
                              </button>
                              {file && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setIsResumeMenuOpen(false);
                                    handleRemoveResume();
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                  Remove Resume
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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
                      className={`rounded-[22px] border-2 border-dashed p-8 text-center transition ${isDragOver ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <FiUploadCloud className="mx-auto h-10 w-10 text-blue-500" />
                      <p className="mt-4 text-sm font-semibold text-slate-900">Drag & drop your resume here</p>
                      <p className="mt-2 text-sm text-slate-500">PDF, DOC, DOCX · Max 5MB</p>
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1769E0] bg-white px-5 py-2 text-sm font-semibold text-[#1769E0] shadow-sm transition hover:bg-[#EAF2FE]"
                      >
                        <FiChevronRight className="h-4 w-4" />
                        Browse files
                      </button>
                    </div>

                    {user?.cv && useProfileCV ? (
                      <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 p-4 text-sm text-slate-900 shadow-sm">
                        <div className="flex items-center gap-3 font-semibold text-blue-700">
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
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1769E0] shadow-sm border border-[#1769E0] transition hover:bg-[#EAF2FE]"
                          >
                            Replace Resume
                          </button>
                        </div>
                      </div>
                    ) : file ? (
                      <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 p-4 text-sm text-slate-900 shadow-sm">
                        <div className="flex items-center gap-3 font-semibold text-blue-700">
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
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1769E0] shadow-sm border border-[#1769E0] transition hover:bg-[#EAF2FE]"
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
                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
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
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{coverLetter.length} / 1000</span>
                    </div>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setCoverLetter(e.target.value);
                        }
                      }}
                      placeholder="Briefly describe your experience, motivation, and why you're interested in this role."
                      className="min-h-[220px] w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      {jobApplicationFields.map((field, index) => {
                        const value = String(applicationFieldAnswers[field._id] || '');
                        const error = formErrors[`field_${field._id}`];
                        const restriction = getScreeningRestriction(field.label);
                        const isRequired = field.required && !restriction?.optional;
                        const sharedInputClass = `w-full rounded-[18px] border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`;
                        return (
                          <label key={field._id} className="space-y-3" data-error={error ? 'true' : undefined}>
                            <span className="text-sm font-semibold text-slate-700">
                              {field.label}
                              {isRequired ? (
                                <span className="ml-1 text-rose-500" aria-hidden="true">*</span>
                              ) : (
                                <span className="ml-1 text-xs font-medium text-slate-400">(Optional)</span>
                              )}
                            </span>
                            {field.type === 'textarea' ? (
                              <textarea
                                value={value}
                                onChange={(e) => setApplicationFieldAnswers((prev) => ({ ...prev, [field._id]: e.target.value }))}
                                rows="4"
                                maxLength={500}
                                className={sharedInputClass}
                              />
                            ) : (
                              <input
                                type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                                value={value}
                                onChange={(e) => {
                                  let newValue = e.target.value;
                                  if (restriction?.pattern) {
                                    newValue = formatPhoneInput(newValue);
                                  }
                                  setApplicationFieldAnswers((prev) => ({ ...prev, [field._id]: newValue }));
                                }}
                                maxLength={restriction?.maxLength || 200}
                                className={sharedInputClass}
                                placeholder={restriction?.pattern ? '09XXXXXXXX or +2519XXXXXXXX' : field.type === 'url' ? 'https://' : ''}
                              />
                            )}
                            {error && (
                              <p className="text-sm text-rose-600" id={`field-error-${index}`}>{error}</p>
                            )}
                          </label>
                        );
                      })}
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
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Negotiable</span>
                      </label>
                      <label className="space-y-3">
                        <span className="text-sm font-semibold text-slate-700">Availability</span>
                        <select
                          value={availability}
                          onChange={(e) => setAvailability(e.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
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
                          maxLength={20}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                          placeholder="https://"
                        />
                      </label>
                      <label className="space-y-3">
                        <span className="text-sm font-semibold text-slate-700">GitHub Profile</span>
                        <input
                          type="url"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          maxLength={20}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                          placeholder="https://github.com/your-username"
                        />
                      </label>
                      <label className="space-y-3 lg:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">LinkedIn Profile</span>
                        <input
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          maxLength={20}
                          className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                          placeholder="https://www.linkedin.com/in/your-name"
                        />
                      </label>
                    </div>
                  </div>

                  <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
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
                        ...jobApplicationFields.map((field) => [
                          field.label,
                          String(applicationFieldAnswers[field._id] || '').trim() || 'Not Provided',
                        ]),
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
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>I certify that all information is accurate.</span>
                    </label>
                    <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={agreeShare}
                        onChange={(e) => setAgreeShare(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>I agree to share my resume with this employer.</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#1769E0] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#0D5BC4] disabled:cursor-not-allowed disabled:bg-slate-300"
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
                            className="rounded-full bg-[#1769E0] px-6 py-3 text-base font-semibold text-white"
                          >
                            {applying ? 'Submitting...' : 'Yes, submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-center text-sm text-slate-500">Estimated completion time: Less than one minute.</p>

                  {submitSuccess && (
                    <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                      Application submitted successfully! You may stay on this page or visit your applications page later.
                    </div>
                  )}
                </form>
              </section>
              )}
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Application Preview</h3>
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
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
                    ...jobApplicationFields.map((field) => ({
                      title: field.label,
                      value: String(applicationFieldAnswers[field._id] || '').trim() || 'Not provided',
                      icon: <FiCheckCircle className="h-5 w-5" />,
                    })),
                  ].map((item) => (
                    <div key={item.title} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
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
                <div className="mt-5 rounded-[28px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
                  <h4 className="text-base font-semibold text-slate-900">What happens next?</h4>
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">1</div>
                      <div>
                        <p className="font-semibold text-slate-900">Your application will be sent to the employer.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">2</div>
                      <div>
                        <p className="font-semibold text-slate-900">Employer will review your application.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">3</div>
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
