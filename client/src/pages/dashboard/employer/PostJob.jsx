import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { fetchEmployerCompany } from '../../../store/slices/employerSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { REGIONS, REGION_CITIES } from '../../../constants/locations';

const BENEFIT_OPTIONS = [
  { value: 'Health Insurance', label: 'Health Insurance', icon: '🩺' },
  { value: 'Medical Insurance', label: 'Medical Insurance', icon: '💊' },
  { value: 'Transport Allowance', label: 'Transport Allowance', icon: '🚍' },
  { value: 'Lunch / Meal Allowance', label: 'Lunch / Meal Allowance', icon: '🍽' },
  { value: 'Mobile Allowance', label: 'Mobile Allowance', icon: '📱' },
  { value: 'Housing Allowance', label: 'Housing Allowance', icon: '🏠' },
  { value: 'Remote Work', label: 'Remote Work', icon: '🏠' },
  { value: 'Flexible Working Hours', label: 'Flexible Working Hours', icon: '⏱' },
  { value: 'Annual Bonus', label: 'Annual Bonus', icon: '💰' },
  { value: 'Performance Bonus', label: 'Performance Bonus', icon: '🏆' },
  { value: 'Paid Leave', label: 'Paid Leave', icon: '🌴' },
  { value: 'Pension', label: 'Pension', icon: '💼' },
  { value: 'Training & Development', label: 'Training & Development', icon: '📚' },
  { value: 'Career Growth', label: 'Career Growth', icon: '🚀' },
  { value: 'Gym Membership', label: 'Gym Membership', icon: '🏋️' },
];

const PostJob = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { company, loading: companyLoading } = useSelector((state) => state.employer);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [existingJob, setExistingJob] = useState(null);
  const [technicalInput, setTechnicalInput] = useState('');
  const [softInput, setSoftInput] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      workMode: 'On-site',
      jobType: 'Full-time',
      experienceLevel: 'Entry Level',
      educationRequired: 'Bachelor',
      salary: {
        currency: 'ETB',
        period: 'Monthly',
        isNegotiable: false,
        isVisible: true
      },
      numberOfPositions: 1,
      skills: { technical: [], soft: [] },
      benefits: [],
      hasOtherBenefit: false,
      otherBenefit: '',
    }
  });

  const { id: jobId } = useParams();
  const selectedRegion = watch('location.region');
  const selectedBenefits = watch('benefits') || [];
  const selectedTechnicalSkills = watch('skills.technical') || [];
  const selectedSoftSkills = watch('skills.soft') || [];
  const hasOtherBenefit = watch('hasOtherBenefit');
  const isEditMode = Boolean(jobId);

  useEffect(() => {
    register('skills.technical');
    register('skills.soft');
  }, [register]);

  const normalizeSkillEntry = (value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const addSkillTags = (type, value) => {
    const tags = normalizeSkillEntry(value);
    if (!tags.length) return false;

    const currentTags = watch(`skills.${type}`) || [];
    const nextTags = [...currentTags];

    tags.forEach((tag) => {
      if (!nextTags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        nextTags.push(tag);
      }
    });

    setValue(`skills.${type}`, nextTags, { shouldValidate: true, shouldDirty: true });
    return true;
  };

  const handleTechnicalKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (addSkillTags('technical', technicalInput)) {
        setTechnicalInput('');
      }
    }
  };

  const handleTechnicalBlur = () => {
    if (addSkillTags('technical', technicalInput)) {
      setTechnicalInput('');
    }
  };

  const handleSoftKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (addSkillTags('soft', softInput)) {
        setSoftInput('');
      }
    }
  };

  const handleSoftBlur = () => {
    if (addSkillTags('soft', softInput)) {
      setSoftInput('');
    }
  };

  const removeSkillTag = (type, index) => {
    const currentTags = watch(`skills.${type}`) || [];
    setValue(
      `skills.${type}`,
      currentTags.filter((_, idx) => idx !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Load company details and categories
  useEffect(() => {
    dispatch(fetchEmployerCompany());
    
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        const categoriesList = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCategories(categoriesList);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    const loadSkills = async () => {
      try {
        const res = await api.get('/skills');
        const skillsList = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setSkills(skillsList);
      } catch (err) {
        console.error('Failed to load skills:', err);
      }
    };

    loadCategories();
    loadSkills();
  }, [dispatch]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchJob = async () => {
      setJobLoading(true);
      try {
        const response = await api.get(`/jobs/${jobId}`);
        const jobData = response.data?.data || response.data;
        if (!jobData) {
          toast.error('Failed to load job for editing');
          return;
        }

        setExistingJob(jobData);
        setValue('title', jobData.title || '');
        setValue('category', jobData.category?._id || jobData.category || '');
        setValue('numberOfPositions', jobData.numberOfPositions || 1);
        setValue('jobType', jobData.jobType || 'Full-time');
        setValue('workMode', jobData.workMode || 'On-site');
        setValue('experienceLevel', jobData.experienceLevel || 'Entry Level');
        setValue('educationRequired', jobData.educationRequired || 'Bachelor');
        setValue('salary.min', jobData.salary?.min || '');
        setValue('salary.max', jobData.salary?.max || '');
        setValue('salary.currency', jobData.salary?.currency || 'ETB');
        setValue('salary.period', jobData.salary?.period || 'Monthly');
        setValue('salary.isNegotiable', jobData.salary?.isNegotiable || false);
            setValue('salary.isVisible', jobData.salary?.isVisible ?? true);
        setValue('location.region', jobData.location?.region || '');
        setValue('location.city', jobData.location?.city || '');
        setValue('location.address', jobData.location?.address || '');
        setValue('description', jobData.description || '');
        setValue('requirements', jobData.requirements || '');
        setValue('responsibilities', jobData.responsibilities || '');
        setValue('applicationDeadline', jobData.applicationDeadline ? new Date(jobData.applicationDeadline).toISOString().split('T')[0] : '');
        setValue('applicationEmail', jobData.applicationEmail || '');
        setValue('applicationUrl', jobData.applicationUrl || '');
        setValue('applicationMethod', jobData.applicationMethod || 'Portal');

        setValue('skills.technical', Array.isArray(jobData.skills?.technical) ? jobData.skills.technical : []);
        setValue('skills.soft', Array.isArray(jobData.skills?.soft) ? jobData.skills.soft : []);

        const benefitValues = Array.isArray(jobData.benefits)
          ? jobData.benefits.filter((item) => BENEFIT_OPTIONS.some((option) => option.value === item))
          : [];
        setValue('benefits', benefitValues);

        const otherBenefits = Array.isArray(jobData.benefits)
          ? jobData.benefits.filter((item) => item && !BENEFIT_OPTIONS.some((option) => option.value === item))
          : [];
        if (otherBenefits.length > 0) {
          setValue('hasOtherBenefit', true);
          setValue('otherBenefit', otherBenefits.join(', '));
        }
      } catch (err) {
        toast.error('Failed to load job details');
        console.error(err);
      } finally {
        setJobLoading(false);
      }
    };

    fetchJob();
  }, [isEditMode, jobId, setValue]);

  const onSubmit = async (data) => {
    if (!company) {
      toast.error('You must register a company profile before posting a job.');
      return;
    }

    setLoading(true);
    try {
      const benefitsPayload = Array.isArray(data.benefits) ? data.benefits.filter(Boolean) : [];
      if (data.hasOtherBenefit && data.otherBenefit?.trim()) {
        benefitsPayload.push(data.otherBenefit.trim());
      }

      const payload = {
        ...data,
        company: company._id,
        benefits: [...new Set(benefitsPayload)],
      };

      if (isEditMode) {
        await api.put(`/jobs/${jobId}`, payload);
        toast.success('Job updated successfully!');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job posted successfully!');
      }
      navigate('/employer/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  if (companyLoading || jobLoading) {
    return <div className="text-center py-12">Loading job information...</div>;
  }

  if (!company) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Company Profile</h2>
        <p className="text-gray-600 mb-6">
          You must create your company profile before you can post jobs.
        </p>
        <button onClick={() => navigate('/employer/company')} className="btn btn-primary">
          Setup Company Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-8">{isEditMode ? 'Edit Job' : 'Post a New Job'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                type="text"
                {...register('title', { required: 'Job title is required' })}
                className="input"
                placeholder="e.g. Senior Full Stack Developer"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="select"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Number of Positions</label>
                <input
                  type="number"
                  {...register('numberOfPositions', { min: 1 })}
                  className="input"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Type</label>
              <select {...register('jobType')} className="select">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Work Mode</label>
              <select {...register('workMode')} className="select">
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Experience Level</label>
              <select {...register('experienceLevel')} className="select">
                <option value="Entry Level">Entry Level (0-2 years)</option>
                <option value="Mid Level">Mid Level (2-5 years)</option>
                <option value="Senior Level">Senior Level (5+ years)</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Education Required</label>
              <select {...register('educationRequired')} className="select">
                <option value="No Requirement">No Requirement</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor Degree</option>
                <option value="Master">Master Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <select
                {...register('location.region', { required: 'Region is required' })}
                className="select"
                onChange={(e) => {
                  setValue('location.region', e.target.value);
                  setValue('location.city', ''); // Reset city
                }}
              >
                <option value="">Select Region</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.location?.region && <p className="text-red-500 text-sm mt-1">{errors.location.region.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                {...register('location.city')}
                className="select"
                disabled={!selectedRegion}
              >
                <option value="">Select City</option>
                {selectedCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">Salary Range (ETB)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Salary</label>
              <input
                type="number"
                {...register('salary.min')}
                className="input"
                placeholder="e.g. 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maximum Salary</label>
              <input
                type="number"
                {...register('salary.max')}
                className="input"
                placeholder="e.g. 20000"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('salary.isNegotiable')}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm">Salary is Negotiable</span>
              </label>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">Benefits</h2>
              <p className="text-sm text-gray-500">Select all benefits that apply to this job.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFIT_OPTIONS.map((benefit) => (
              <label
                key={benefit.value}
                className="rounded-3xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer flex items-start gap-3"
              >
                <input
                  type="checkbox"
                  value={benefit.value}
                  {...register('benefits')}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex-1">
                  <span className="mr-2">{benefit.icon}</span>
                  {benefit.label}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('hasOtherBenefit')}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium">Add another benefit</span>
            </label>

            {hasOtherBenefit && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Other Benefit</label>
                <input
                  type="text"
                  {...register('otherBenefit')}
                  className="input"
                  placeholder="e.g. Travel reimbursement"
                />
              </div>
            )}
          </div>
        </div>

        {/* Required Skills */}
        <div className="card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">Required Skills</h2>
              <p className="text-sm text-gray-500">Add technical and soft skills required for this job. Press Enter or comma to add each tag.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Technical Skills</label>
              <div className="rounded-3xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
                <div className="flex flex-wrap gap-2">
                  {selectedTechnicalSkills.map((skill, index) => (
                    <button
                      key={`${skill}-${index}`}
                      type="button"
                      onClick={() => removeSkillTag('technical', index)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                    >
                      {skill}
                      <span className="text-xs">×</span>
                    </button>
                  ))}
                  <input
                    type="text"
                    value={technicalInput}
                    onChange={(e) => setTechnicalInput(e.target.value)}
                    onKeyDown={handleTechnicalKeyDown}
                    onBlur={handleTechnicalBlur}
                    className="min-w-[160px] flex-1 border-none bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                    placeholder="Add technical skill"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">At least one technical skill is required.</p>
              {errors.skills?.technical && <p className="text-red-500 text-sm mt-2">{errors.skills.technical.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Soft Skills</label>
              <div className="rounded-3xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
                <div className="flex flex-wrap gap-2">
                  {selectedSoftSkills.map((skill, index) => (
                    <button
                      key={`${skill}-${index}`}
                      type="button"
                      onClick={() => removeSkillTag('soft', index)}
                      className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                    >
                      {skill}
                      <span className="text-xs">×</span>
                    </button>
                  ))}
                  <input
                    type="text"
                    value={softInput}
                    onChange={(e) => setSoftInput(e.target.value)}
                    onKeyDown={handleSoftKeyDown}
                    onBlur={handleSoftBlur}
                    className="min-w-[160px] flex-1 border-none bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                    placeholder="Add soft skill"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">Add soft skills that will help candidates succeed in this role.</p>
              {errors.skills?.soft && <p className="text-red-500 text-sm mt-2">{errors.skills.soft.message}</p>}
            </div>
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">Job Description & Requirements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Description</label>
              <textarea
                {...register('description', { required: 'Job description is required' })}
                className="textarea"
                rows="6"
                placeholder="Provide a detailed overview of the role, responsibilities, and expected outcomes..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Requirements (one per line)</label>
              <textarea
                {...register('requirements')}
                className="textarea"
                rows="4"
                placeholder="e.g. B.Sc. in Computer Science or related field&#10;3+ years of experience with React/Node.js&#10;Excellent communication skills..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Responsibilities (one per line)</label>
              <textarea
                {...register('responsibilities')}
                className="textarea"
                rows="4"
                placeholder="e.g. Write clean, maintainable code&#10;Collaborate with cross-functional teams&#10;Optimize application for maximum speed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Application Deadline</label>
              <input
                type="date"
                {...register('applicationDeadline', { required: 'Deadline is required' })}
                className="input"
              />
              {errors.applicationDeadline && <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/employer/jobs')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Publish Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
