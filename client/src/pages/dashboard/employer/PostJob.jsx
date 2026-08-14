import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { fetchEmployerCompany } from '../../../store/slices/employerSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { REGIONS, REGION_CITIES } from '../../../constants/locations';

const BENEFIT_OPTIONS = [
  { value: 'Health Insurance', labelKey: 'employer.postJob.benefits.healthInsurance', icon: '🩺' },
  { value: 'Medical Insurance', labelKey: 'employer.postJob.benefits.medicalInsurance', icon: '💊' },
  { value: 'Transport Allowance', labelKey: 'employer.postJob.benefits.transportAllowance', icon: '🚍' },
  { value: 'Lunch / Meal Allowance', labelKey: 'employer.postJob.benefits.lunchMealAllowance', icon: '🍽' },
  { value: 'Mobile Allowance', labelKey: 'employer.postJob.benefits.mobileAllowance', icon: '📱' },
  { value: 'Housing Allowance', labelKey: 'employer.postJob.benefits.housingAllowance', icon: '🏠' },
  { value: 'Remote Work', labelKey: 'employer.postJob.benefits.remoteWork', icon: '🏠' },
  { value: 'Flexible Working Hours', labelKey: 'employer.postJob.benefits.flexibleWorkingHours', icon: '⏱' },
  { value: 'Annual Bonus', labelKey: 'employer.postJob.benefits.annualBonus', icon: '💰' },
  { value: 'Performance Bonus', labelKey: 'employer.postJob.benefits.performanceBonus', icon: '🏆' },
  { value: 'Paid Leave', labelKey: 'employer.postJob.benefits.paidLeave', icon: '🌴' },
  { value: 'Pension', labelKey: 'employer.postJob.benefits.pension', icon: '💼' },
  { value: 'Training & Development', labelKey: 'employer.postJob.benefits.trainingDevelopment', icon: '📚' },
  { value: 'Career Growth', labelKey: 'employer.postJob.benefits.careerGrowth', icon: '🚀' },
  { value: 'Gym Membership', labelKey: 'employer.postJob.benefits.gymMembership', icon: '🏋️' },
];

const JOB_TYPE_OPTIONS = [
  { value: 'Full-time', labelKey: 'employer.postJob.jobType.fullTime' },
  { value: 'Part-time', labelKey: 'employer.postJob.jobType.partTime' },
  { value: 'Contract', labelKey: 'employer.postJob.jobType.contract' },
  { value: 'Internship', labelKey: 'employer.postJob.jobType.internship' },
  { value: 'Freelance', labelKey: 'employer.postJob.jobType.freelance' },
  { value: 'Temporary', labelKey: 'employer.postJob.jobType.temporary' },
];

const WORK_MODE_OPTIONS = [
  { value: 'On-site', labelKey: 'employer.postJob.workMode.onSite' },
  { value: 'Remote', labelKey: 'employer.postJob.workMode.remote' },
  { value: 'Hybrid', labelKey: 'employer.postJob.workMode.hybrid' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'Entry Level', labelKey: 'employer.postJob.experience.entryLevel' },
  { value: 'Mid Level', labelKey: 'employer.postJob.experience.midLevel' },
  { value: 'Senior Level', labelKey: 'employer.postJob.experience.seniorLevel' },
  { value: 'Lead', labelKey: 'employer.postJob.experience.lead' },
  { value: 'Manager', labelKey: 'employer.postJob.experience.manager' },
  { value: 'Director', labelKey: 'employer.postJob.experience.director' },
  { value: 'Executive', labelKey: 'employer.postJob.experience.executive' },
];

const EDUCATION_REQUIRED_OPTIONS = [
  { value: 'No Requirement', labelKey: 'employer.postJob.education.noRequirement' },
  { value: 'High School', labelKey: 'employer.postJob.education.highSchool' },
  { value: 'Diploma', labelKey: 'employer.postJob.education.diploma' },
  { value: 'Bachelor', labelKey: 'employer.postJob.education.bachelor' },
  { value: 'Master', labelKey: 'employer.postJob.education.master' },
  { value: 'PhD', labelKey: 'employer.postJob.education.phd' },
];

const PostJob = () => {
  const { t } = useTranslation();
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
          toast.error(t('employer.postJob.error.loadFailed'));
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
        toast.error(t('employer.postJob.error.loadDetailsFailed'));
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
        toast.success(t('employer.postJob.success.jobUpdated'));
      } else {
        await api.post('/jobs', payload);
        toast.success(t('employer.postJob.success.jobPosted'));
      }
      navigate('/employer/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || t('employer.postJob.error.saveFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  if (companyLoading || jobLoading) {
    return <div className="text-center py-12">{t('employer.postJob.loadingJobInfo')}</div>;
  }

  if (!company) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t('employer.postJob.noCompanyProfile')}</h2>
        <p className="text-gray-600 mb-6">
          {t('employer.postJob.companyProfileRequired')}
        </p>
        <button onClick={() => navigate('/employer/company')} className="btn btn-primary">
          {t('employer.postJob.setupCompanyProfile')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-8">{isEditMode ? t('employer.postJob.editJob') : t('employer.postJob.newJob')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">{t('employer.postJob.basicInformation')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.jobTitle')}</label>
              <input
                type="text"
                {...register('title', { required: t('employer.postJob.validation.jobTitleRequired') })}
                className="input"
                placeholder={t('employer.postJob.placeholders.jobTitle')}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('employer.postJob.category')}</label>
                <select
                  {...register('category', { required: t('employer.postJob.validation.categoryRequired') })}
                  className="select"
                >
                  <option value="">{t('employer.postJob.placeholders.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('employer.postJob.numberOfPositions')}</label>
                <input
                  type="number"
                  {...register('numberOfPositions', { min: { value: 1, message: t('employer.postJob.validation.minPositions') } })}
                  className="input"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">{t('employer.postJob.jobDetails')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.jobType')}</label>
              <select {...register('jobType')} className="select">
                {JOB_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.workMode')}</label>
              <select {...register('workMode')} className="select">
                {WORK_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.experienceLevel')}</label>
              <select {...register('experienceLevel')} className="select">
                {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.educationRequired')}</label>
              <select {...register('educationRequired')} className="select">
                {EDUCATION_REQUIRED_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">{t('employer.postJob.location')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.region')}</label>
              <select
                {...register('location.region', { required: t('employer.postJob.validation.regionRequired') })}
                className="select"
                onChange={(e) => {
                  setValue('location.region', e.target.value);
                  setValue('location.city', ''); // Reset city
                }}
              >
                <option value="">{t('employer.postJob.placeholders.selectRegion')}</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.location?.region && <p className="text-red-500 text-sm mt-1">{errors.location.region.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.city')}</label>
              <select
                {...register('location.city')}
                className="select"
                disabled={!selectedRegion}
              >
                <option value="">{t('employer.postJob.placeholders.selectCity')}</option>
                {selectedCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">{t('employer.postJob.salaryRange')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.minimumSalary')}</label>
              <input
                type="number"
                {...register('salary.min')}
                className="input"
                placeholder={t('employer.postJob.placeholders.minimumSalary')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.maximumSalary')}</label>
              <input
                type="number"
                {...register('salary.max')}
                className="input"
                placeholder={t('employer.postJob.placeholders.maximumSalary')}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('salary.isNegotiable')}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm">{t('employer.postJob.salaryNegotiable')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">{t('employer.postJob.benefits')}</h2>
              <p className="text-sm text-gray-500">{t('employer.postJob.benefitsDescription')}</p>
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
                  {t(benefit.labelKey)}
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
              <span className="text-sm font-medium">{t('employer.postJob.addAnotherBenefit')}</span>
            </label>

            {hasOtherBenefit && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">{t('employer.postJob.otherBenefit')}</label>
                <input
                  type="text"
                  {...register('otherBenefit')}
                  className="input"
                  placeholder={t('employer.postJob.placeholders.otherBenefit')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Required Skills */}
        <div className="card">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">{t('employer.postJob.requiredSkills')}</h2>
              <p className="text-sm text-gray-500">{t('employer.postJob.requiredSkillsDescription')}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">{t('employer.postJob.technicalSkills')}</label>
              <div className="rounded-3xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
                <div className="flex flex-wrap gap-2">
                  {selectedTechnicalSkills.map((skill, index) => (
                    <button
                      key={`${skill}-${index}`}
                      type="button"
                      onClick={() => removeSkillTag('technical', index)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#EAF2FE] px-3 py-1 text-sm font-semibold text-[#1769E0] transition hover:bg-emerald-200"
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
                    placeholder={t('employer.postJob.placeholders.addTechnicalSkill')}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">{t('employer.postJob.technicalSkillsDescription')}</p>
              {errors.skills?.technical && <p className="text-red-500 text-sm mt-2">{errors.skills.technical.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('employer.postJob.softSkills')}</label>
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
                    placeholder={t('employer.postJob.placeholders.addSoftSkill')}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">{t('employer.postJob.softSkillsDescription')}</p>
              {errors.skills?.soft && <p className="text-red-500 text-sm mt-2">{errors.skills.soft.message}</p>}
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">{t('employer.postJob.descriptionRequirements')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.jobDescription')}</label>
              <textarea
                {...register('description', { required: t('employer.postJob.validation.jobDescriptionRequired') })}
                className="textarea"
                rows="6"
                placeholder={t('employer.postJob.placeholders.jobDescription')}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.requirements')}</label>
              <textarea
                {...register('requirements')}
                className="textarea"
                rows="4"
                placeholder={t('employer.postJob.placeholders.requirements')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.responsibilities')}</label>
              <textarea
                {...register('responsibilities')}
                className="textarea"
                rows="4"
                placeholder={t('employer.postJob.placeholders.responsibilities')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('employer.postJob.applicationDeadline')}</label>
              <input
                type="date"
                {...register('applicationDeadline', { required: t('employer.postJob.validation.deadlineRequired') })}
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
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? t('employer.postJob.buttons.posting') : t('employer.postJob.buttons.publishJob')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
