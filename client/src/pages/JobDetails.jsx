import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiCalendar, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);
  
  // Use Redux auth selector instead of AuthContext
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Application form state
  const [showApply, setShowApply] = useState(false);
  const isJobSeeker = user?.role === 'jobseeker';
  const isAdmin = user?.role === 'admin';
  const [coverLetter, setCoverLetter] = useState('');
  const [useProfileCV, setUseProfileCV] = useState(Boolean(user?.cv));
  const [file, setFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const canUseProfileCV = Boolean(user?.cv);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const detailsRes = await api.get(`/jobs/${id}`);
        setJob(detailsRes.data?.data || detailsRes.data);

        // Fetch similar jobs
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

  useEffect(() => {
    setUseProfileCV(Boolean(user?.cv));
    setResumeError('');
  }, [user?.cv]);

  const resetApplicationForm = () => {
    setCoverLetter('');
    setUseProfileCV(Boolean(user?.cv));
    setFile(null);
    setResumeError('');
  };

  const validateResumeFile = (selectedFile) => {
    if (!selectedFile) {
      return '';
    }

    const extension = selectedFile.name?.split('.').pop()?.toLowerCase();
    const isAllowedExtension = ALLOWED_RESUME_EXTENSIONS.includes(extension);
    const isAllowedMimeType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type);

    if (!isAllowedExtension && !isAllowedMimeType) {
      return 'Only PDF, DOC, or DOCX files are allowed.';
    }

    if (selectedFile.size > MAX_RESUME_SIZE) {
      return 'Resume file must be 10MB or smaller.';
    }

    return '';
  };

  const handleResumeFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validationError = validateResumeFile(selectedFile);

    if (validationError) {
      setFile(null);
      setResumeError(validationError);
      event.target.value = '';
      toast.error(validationError);
      return;
    }

    setFile(selectedFile);
    setResumeError('');
  };

  if (loading) {
    return (
      <div className="section container-custom max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 animate-pulse w-1/4 rounded"></div>
        <div className="card animate-pulse h-96 bg-gray-100 dark:bg-gray-800"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="section container-custom text-center max-w-md mx-auto">
        <FiAlertTriangle className="text-red-500 w-16 h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="text-gray-500 mb-6">The job post you are looking for does not exist or has been closed.</p>
        <button onClick={() => navigate('/jobs')} className="btn btn-primary">
          Back to Browse Jobs
        </button>
      </div>
    );
  }

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit an application');
      navigate('/login');
      return;
    }

    if (!isJobSeeker) {
      toast.error('Only job seekers can apply for jobs.');
      return;
    }

    if (!useProfileCV) {
      const validationError = validateResumeFile(file);
      if (validationError) {
        setResumeError(validationError);
        toast.error(validationError);
        return;
      }
    }

    const hasResume = useProfileCV ? Boolean(user?.cv) : Boolean(file);
    if (!hasResume) {
      setResumeError('Please upload a resume or use your profile CV to apply');
      toast.error('Please upload a resume or use your profile CV to apply');
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('job', job._id);
      formData.append('coverLetter', coverLetter);
      formData.append('useProfileCV', String(useProfileCV));
      if (!useProfileCV && file) {
        formData.append('resume', file);
      }

      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Your application was submitted successfully!');
      setShowApply(false);
      resetApplicationForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="section container-custom py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mb-6 transition"
      >
        <FiArrowLeft /> Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            
            {/* Header info */}
            <div className="border-b pb-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{job.title}</h1>
                {job.isFeatured && (
                  <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-xl font-semibold text-primary-600 dark:text-primary-400 mb-4">
                {job.company?.name || 'Company Details Not Available'}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FiMapPin /> {job.location?.city ? `${job.location.city}, ${job.location.region}` : job.location?.region}
                </span>
                <span className="flex items-center gap-1">
                  <FiBriefcase /> {job.jobType}
                </span>
                {job.workMode && (
                  <span className="badge badge-primary capitalize">{job.workMode}</span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl mb-6">
              <div>
                <p className="text-xs text-gray-400">Salary</p>
                <p className="font-semibold text-sm flex items-center">
                  <FiDollarSign />
                  {job.salary?.min && job.salary?.max
                    ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ETB`
                    : 'Negotiable'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Experience Needed</p>
                <p className="font-semibold text-sm capitalize">{job.experienceLevel || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Deadline</p>
                <p className="font-semibold text-sm flex items-center gap-1 text-red-500">
                  <FiClock /> {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Job Description</h3>
                <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{job.description}</p>
              </div>
              
              {job.requirements && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Requirements</h3>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{job.requirements}</p>
                </div>
              )}

              {job.responsibilities && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Responsibilities</h3>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{job.responsibilities}</p>
                </div>
              )}
            </div>

            {/* Application Section Trigger */}
            <div className="mt-8 pt-6 border-t">
              {!isAuthenticated ? (
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary w-full md:w-auto"
                >
                  Login to Apply
                </button>
              ) : isAdmin ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Admin view only. Application actions are hidden for moderation.
                </div>
              ) : user?.role === 'employer' ? null : (
                !showApply ? (
                  <button 
                    onClick={() => setShowApply(true)} 
                    className="btn btn-primary w-full md:w-auto"
                  >
                    Apply For This Job
                  </button>
                ) : (
                  <div className="card bg-gray-50 dark:bg-gray-800/20 p-6 border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Apply Now</h3>
                      <button 
                        onClick={() => setShowApply(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleApply} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Cover Letter</label>
                        <textarea 
                          value={coverLetter} 
                          onChange={(e) => setCoverLetter(e.target.value)} 
                          className="textarea" 
                          rows={6}
                          placeholder="Write a brief cover letter explaining why you're a great fit..."
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        {!canUseProfileCV ? (
                          <p className="text-sm text-amber-600">No profile resume is saved. Please upload a custom resume.</p>
                        ) : (
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={useProfileCV} 
                              onChange={(e) => {
                                setUseProfileCV(e.target.checked);
                                setResumeError('');
                              }}
                              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm">Use my profile resume / CV</span>
                          </label>
                        )}

                        {canUseProfileCV && useProfileCV && user?.cv && (
                          <p className="text-xs text-gray-500 ml-7">
                            Currently attached: <a href={user.cv} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">View CV</a>
                          </p>
                        )}

                        {(!canUseProfileCV || !useProfileCV) && (
                          <div className="pt-2">
                            <label className="block text-sm font-semibold mb-2">Upload Custom Resume</label>
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeFileChange}
                              className="text-sm"
                            />
                            {resumeError && (
                              <p className="text-sm text-red-500 mt-2">{resumeError}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          disabled={applying}
                        >
                          {applying ? 'Submitting...' : 'Submit Application'}
                        </button>
                      </div>
                    </form>
                  </div>
                )
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Company Overview & Similar Jobs */}
        <div className="space-y-6">
          {/* Company Brief Card */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {job.company?.logo ? (
                  <img
                    src={job.company.logo}
                    alt={`${job.company.name} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                    No logo
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">About the Company</h3>
                <p className="text-sm text-gray-500">{job.company?.name || 'Company Details Not Available'}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {job.company?.description || 'No description available for this company.'}
            </p>
            {job.company?.website && (
              <a 
                href={job.company.website} 
                target="_blank" 
                rel="noreferrer" 
                className="text-sm text-primary-500 hover:underline"
              >
                Visit Website &rarr;
              </a>
            )}
          </div>

          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Similar Opportunities</h3>
              <div className="space-y-4">
                {similarJobs.map((sim) => (
                  <Link 
                    key={sim._id} 
                    to={`/jobs/${sim._id}`} 
                    className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{sim.title}</h4>
                    <p className="text-xs text-primary-500">{sim.company?.name}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{sim.location?.region}</span>
                      <span>{sim.jobType}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default JobDetails;
