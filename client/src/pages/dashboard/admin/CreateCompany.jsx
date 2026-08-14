import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiGlobe,
  FiMail,
  FiPhone,
  FiFileText,
  FiImage,
  FiX,
  FiTrash2,
  FiBriefcase,
  FiUser,
  FiStar,
} from 'react-icons/fi';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { REGIONS, REGION_CITIES } from '../../../constants/locations';
import { fetchAdminCompanies } from '../../../store/slices/adminSlice';
import { useDispatch } from 'react-redux';

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-1000', label: '501–1000 employees' },
  { value: '1001-5000', label: '1001–5000 employees' },
  { value: '5000+', label: '5000+ employees' },
];
const COMPANY_TYPES = ['Private', 'Public', 'Non-Profit', 'Government', 'Startup'];
const FOUNDED_YEARS = Array.from({ length: 75 }, (_, index) => new Date().getFullYear() - index);

const IMAGE_ACCEPT = 'image/*';
const DOC_ACCEPT = '.pdf,image/*,.doc,.docx';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB — matches backend multer limit
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB — matches backend multer limit

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileKind = (file) => {
  const ext = (file?.name || '').split('.').pop()?.toLowerCase();
  const isImage = file?.type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  const isPdf = file?.type === 'application/pdf' || ext === 'pdf';
  return { isImage, isPdf };
};

/* ── Custom upload field (drag & drop + browse) ───────────────────────────── */
const FileUploadField = ({ label, required = false, file, onFileChange, accept, imageOnly = false, maxSize, helperText, disabled = false }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState(null);

  const validateFile = (f) => {
    if (!f) return { ok: false, msg: '' };
    const { isImage, isPdf } = getFileKind(f);
    if (imageOnly) {
      if (!isImage) {
        return { ok: false, msg: t('admin.createCompany.upload.imageOnlyError', { defaultValue: 'Unsupported file type. Please upload an image (PNG, JPG, JPEG, WEBP, SVG).' }) };
      }
    } else if (!isImage && !isPdf) {
      return { ok: false, msg: t('admin.createCompany.upload.docTypeError', { defaultValue: 'Unsupported file type. Please upload a PDF, DOC, DOCX or image.' }) };
    }
    if (f.size > maxSize) {
      return { ok: false, msg: t('admin.createCompany.upload.sizeError', { defaultValue: 'File size exceeds the maximum allowed size ({{size}}).', size: formatBytes(maxSize) }) };
    }
    return { ok: true, msg: '' };
  };

  const handleFile = (f) => {
    if (!f) return;
    const result = validateFile(f);
    if (!result.ok) {
      setLocalError(result.msg);
      onFileChange(null);
      return;
    }
    setLocalError(null);
    onFileChange(f);
  };

  const openPicker = () => inputRef.current?.click();

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  };

  const { isImage, isPdf } = getFileKind(file);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const acceptLabel = imageOnly
    ? t('admin.createCompany.upload.imageTypes', { defaultValue: 'PNG, JPG, JPEG, WEBP or SVG' })
    : t('admin.createCompany.upload.docTypes', { defaultValue: 'PDF, DOC, DOCX, PNG, JPG, JPEG or WEBP' });

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
        disabled={disabled}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="flex min-w-0 items-center gap-3">
            {isImage && previewUrl ? (
              <img src={previewUrl} alt={file.name} className="h-14 w-14 flex-shrink-0 rounded-xl border border-slate-200 bg-white object-cover" />
            ) : (
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm">
                <FiFileText className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-gray-100">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {isPdf ? 'PDF' : (file.type || 'File')} • {formatBytes(file.size)}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openPicker}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1769E0] bg-white px-3 py-1.5 text-xs font-bold text-[#1769E0] transition hover:bg-[#EAF2FE] dark:border-[#1769E0] dark:bg-gray-800 dark:text-emerald-300"
            >
              <FiUploadCloud className="h-3.5 w-3.5" />
              {t('admin.createCompany.upload.replace', { defaultValue: 'Replace' })}
            </button>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-300"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              {t('admin.createCompany.upload.remove', { defaultValue: 'Remove' })}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragOver
              ? 'border-emerald-400 bg-[#EAF2FE] dark:border-emerald-500 dark:bg-emerald-900/30'
              : 'border-slate-200 bg-slate-50/60 hover:border-[#1769E0] hover:bg-[#EAF2FE]/40 dark:border-gray-700 dark:bg-gray-800/50'
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2FE] text-[#1769E0] dark:bg-emerald-900/40 dark:text-emerald-300">
            {imageOnly ? <FiImage className="h-6 w-6" /> : <FiUploadCloud className="h-6 w-6" />}
          </span>
          <span className="text-sm font-bold text-slate-700 dark:text-gray-200">
            {t('admin.createCompany.upload.uploadFile', { defaultValue: 'Upload file' })}
          </span>
          <span className="text-xs text-slate-400">
            {t('admin.createCompany.upload.dragDrop', { defaultValue: 'Drag & drop or click to browse' })}
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
            <FiCheckCircle className="h-3 w-3 text-[#1769E0]" />
            {acceptLabel}
          </span>
        </button>
      )}

      {helperText && !file && !localError && <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>}
      {localError && <p className="mt-1.5 text-xs font-semibold text-red-600">{localError}</p>}
    </div>
  );
};

/* ── Form field wrappers ──────────────────────────────────────────────────── */
const FieldLabel = ({ children, required = false }) => (
  <span className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
    {children} {required && <span className="text-red-500">*</span>}
  </span>
);

const FieldError = ({ message }) => (message ? <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p> : null);

const InputWithIcon = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input {...props} className="input pl-10" />
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────────────── */
const CreateCompany = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [tinCertificateFile, setTinCertificateFile] = useState(null);
  const [companyRegistrationFile, setCompanyRegistrationFile] = useState(null);
  const [logoError, setLogoError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const submitInFlight = useRef(false);

  const logoPreviewUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : ''), [logoFile]);
  useEffect(() => () => {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
  }, [logoPreviewUrl]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      industry: '',
      companySize: '1-10',
      foundedYear: '',
      companyType: 'Private',
      website: '',
      email: '',
      phone: '',
      location: { region: '', city: '', address: '' },
      socialLinks: { linkedin: '', facebook: '', telegram: '', instagram: '' },
      recruiter: { hrManagerName: '', position: '', email: '', phone: '' },
    },
  });

  const selectedRegion = watch('location.region');
  const cityOptions = useMemo(() => (selectedRegion ? REGION_CITIES[selectedRegion] || [] : []), [selectedRegion]);

  const preview = {
    name: watch('name'),
    industry: watch('industry'),
    description: watch('description'),
    website: watch('website'),
    email: watch('email'),
    phone: watch('phone'),
    region: watch('location.region'),
    city: watch('location.city'),
    address: watch('location.address'),
    recruiterName: watch('recruiter.hrManagerName'),
    recruiterPosition: watch('recruiter.position'),
    recruiterEmail: watch('recruiter.email'),
    recruiterPhone: watch('recruiter.phone'),
  };

  const previewLocation = useMemo(() => {
    const parts = [preview.city, preview.region, preview.address].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  }, [preview.city, preview.region, preview.address]);

  const notProvided = t('admin.createCompany.preview.notProvided', { defaultValue: 'Not provided' });

  const validateWebsite = (value) => {
    if (!value) return true;
    if (!/^https?:\/\/.+/.test(value.trim())) {
      return t('admin.createCompany.validation.website', { defaultValue: 'Please enter a valid website URL.' });
    }
    return true;
  };

  const validateEmail = (value) => {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? true
      : t('admin.createCompany.validation.email', { defaultValue: 'Please enter a valid email address.' });
  };

  const validatePhone = (value) => {
    if (!value) return true;
    return /^[0-9()+\-\s]{7,20}$/.test(value)
      ? true
      : t('admin.createCompany.validation.phone', { defaultValue: 'Please enter a valid phone number.' });
  };

  const buildFormData = (data) => {
    const formData = new FormData();
    const appendValue = (key, value) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    };

    appendValue('name', data.name);
    appendValue('description', data.description);
    appendValue('industry', data.industry);
    appendValue('companySize', data.companySize);
    appendValue('foundedYear', data.foundedYear);
    appendValue('companyType', data.companyType);
    appendValue('website', data.website);
    appendValue('email', data.email);
    appendValue('phone', data.phone);
    appendValue('location', data.location);
    appendValue('socialLinks', data.socialLinks);
    appendValue('recruiter', data.recruiter);

    if (logoFile) formData.append('logo', logoFile);
    if (coverFile) formData.append('coverImage', coverFile);
    if (businessLicenseFile) formData.append('businessLicense', businessLicenseFile);
    if (tinCertificateFile) formData.append('tinCertificate', tinCertificateFile);
    if (companyRegistrationFile) formData.append('companyRegistration', companyRegistrationFile);

    return formData;
  };

  const onSubmit = async (values) => {
    if (submitInFlight.current) return;
    if (!logoFile) {
      setLogoError(t('admin.createCompany.errors.logoRequired', { defaultValue: 'Company logo is required.' }));
      return;
    }
    setLogoError('');
    setUploadProgress(0);
    submitInFlight.current = true;

    try {
      const formData = buildFormData(values);
      await api.post('/companies', formData, {
        skipGlobalErrorToast: true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total)));
          }
        },
      });
      toast.success(t('admin.createCompany.successMessage', { defaultValue: 'Company created successfully and submitted for approval.' }));
      dispatch(fetchAdminCompanies());
      navigate('/admin/companies');
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401) {
        // Session expired — the global interceptor signs the user out automatically.
      } else if (error.code === 'ERR_NETWORK') {
        toast.error(t('admin.createCompany.networkError', { defaultValue: 'Unable to reach the server. Please check your connection and try again.' }));
      } else if (error.response?.data?.errors) {
        toast.error(t('admin.createCompany.validationFailed', { defaultValue: 'Please correct the highlighted fields and try again.' }));
      } else if (message && /upload|file|unsupported|format|too large|size/i.test(message)) {
        toast.error(t('admin.createCompany.uploadFailed', { defaultValue: 'File upload failed. Please try again.' }));
      } else if (message) {
        toast.error(message);
      } else {
        toast.error(t('admin.createCompany.errorMessage', { defaultValue: 'Unable to create company. Please try again.' }));
      }
    } finally {
      submitInFlight.current = false;
    }
  };

  const onCancel = () => navigate('/admin/companies');

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-[#1769E0] hover:text-[#1769E0] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            aria-label={t('admin.createCompany.back', { defaultValue: 'Back to Companies' })}
            title={t('admin.createCompany.back', { defaultValue: 'Back to Companies' })}
          >
            <FiArrowLeft className="h-4 w-4" />
            {t('admin.createCompany.back', { defaultValue: 'Back to Companies' })}
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('admin.createCompany.title', { defaultValue: 'Add New Company' })}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('admin.createCompany.subtitle', { defaultValue: 'Create a company profile and submit it for admin approval.' })}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <FiClock className="h-3.5 w-3.5" />
          {t('admin.createCompany.pendingBadge', { defaultValue: 'New companies are reviewed before being listed' })}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          {/* ── Section 1: Basic Information ── */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 border-b border-slate-100 pb-3 dark:border-gray-700">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                {t('admin.createCompany.sections.basicInfo', { defaultValue: 'Basic Information' })}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('admin.createCompany.sections.basicInfoDescription', { defaultValue: "Enter the company's basic information." })}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel required>{t('admin.createCompany.fields.name', { defaultValue: 'Company Name' })}</FieldLabel>
                <input
                  type="text"
                  {...register('name', { required: t('admin.createCompany.validation.name', { defaultValue: 'Company name is required' }) })}
                  className="input"
                  placeholder={t('admin.createCompany.fields.namePlaceholder', { defaultValue: 'Enter company name' })}
                />
                <FieldError message={errors.name?.message} />
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.industry', { defaultValue: 'Industry' })}</FieldLabel>
                <input
                  type="text"
                  {...register('industry')}
                  className="input"
                  placeholder={t('admin.createCompany.fields.industryPlaceholder', { defaultValue: 'e.g. Technology, Finance, Healthcare' })}
                />
                <FieldError message={errors.industry?.message} />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.companySize', { defaultValue: 'Company Size' })}</FieldLabel>
                <select {...register('companySize')} className="input">
                  {COMPANY_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.foundedYear', { defaultValue: 'Founded Year' })}</FieldLabel>
                <select {...register('foundedYear')} className="input">
                  <option value="">{t('admin.createCompany.fields.foundedYearPlaceholder', { defaultValue: 'Select founded year' })}</option>
                  {FOUNDED_YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.companyType', { defaultValue: 'Company Type' })}</FieldLabel>
                <select {...register('companyType')} className="input">
                  {COMPANY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <FieldLabel>{t('admin.createCompany.fields.description', { defaultValue: 'Company Description' })}</FieldLabel>
              <textarea
                rows={5}
                {...register('description')}
                className="input min-h-[140px] resize-none"
                placeholder={t('admin.createCompany.fields.descriptionPlaceholder', { defaultValue: 'Describe the company, its services, mission and activities...' })}
              />
              <FieldError message={errors.description?.message} />
            </label>
          </section>

          {/* ── Section 2: Contact Information ── */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 border-b border-slate-100 pb-3 dark:border-gray-700">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                {t('admin.createCompany.sections.contact', { defaultValue: 'Company Contact Information' })}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('admin.createCompany.sections.contactDescription', { defaultValue: 'How can clients and candidates reach the company?' })}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.website', { defaultValue: 'Website' })}</FieldLabel>
                <InputWithIcon icon={FiGlobe} type="text" {...register('website', { validate: validateWebsite })} placeholder={t('admin.createCompany.fields.websitePlaceholder', { defaultValue: 'https://company.com' })} />
                <FieldError message={errors.website?.message} />
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.email', { defaultValue: 'Company Email' })}</FieldLabel>
                <InputWithIcon icon={FiMail} type="email" {...register('email', { validate: validateEmail })} placeholder={t('admin.createCompany.fields.emailPlaceholder', { defaultValue: 'company@example.com' })} />
                <FieldError message={errors.email?.message} />
              </label>

              <label className="block sm:col-span-2">
                <FieldLabel>{t('admin.createCompany.fields.phone', { defaultValue: 'Company Phone' })}</FieldLabel>
                <InputWithIcon icon={FiPhone} type="tel" {...register('phone', { validate: validatePhone })} placeholder={t('admin.createCompany.fields.phonePlaceholder', { defaultValue: '+251 9XX XXX XXX' })} />
                <FieldError message={errors.phone?.message} />
              </label>
            </div>
          </section>

          {/* ── Section 3: Location ── */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 border-b border-slate-100 pb-3 dark:border-gray-700">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                {t('admin.createCompany.sections.location', { defaultValue: 'Location' })}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('admin.createCompany.sections.locationDescription', { defaultValue: 'Where is the company located?' })}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.region', { defaultValue: 'Region' })}</FieldLabel>
                <select {...register('location.region')} className="input">
                  <option value="">{t('admin.createCompany.fields.regionPlaceholder', { defaultValue: 'Select region' })}</option>
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.city', { defaultValue: 'City' })}</FieldLabel>
                <select {...register('location.city')} className="input" disabled={!selectedRegion}>
                  <option value="">
                    {selectedRegion
                      ? t('admin.createCompany.fields.cityPlaceholder', { defaultValue: 'Select city' })
                      : t('admin.createCompany.fields.chooseRegionFirst', { defaultValue: 'Select region first' })}
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {!selectedRegion && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    {t('admin.createCompany.fields.chooseRegionFirst', { defaultValue: 'Select region first' })}
                  </p>
                )}
              </label>
            </div>

            <label className="mt-4 block">
              <FieldLabel>{t('admin.createCompany.fields.address', { defaultValue: 'Address' })}</FieldLabel>
              <InputWithIcon icon={FiMapPin} type="text" {...register('location.address')} placeholder={t('admin.createCompany.fields.addressPlaceholder', { defaultValue: 'Enter company address' })} />
            </label>
          </section>

          {/* ── Section 4: Recruiter / HR Contact ── */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 border-b border-slate-100 pb-3 dark:border-gray-700">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                {t('admin.createCompany.sections.recruiter', { defaultValue: 'Recruiter / HR Contact' })}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('admin.createCompany.sections.recruiterDescription', { defaultValue: 'Who should we contact about this company?' })}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.hrManagerName', { defaultValue: 'HR Manager Name' })}</FieldLabel>
                <input
                  type="text"
                  {...register('recruiter.hrManagerName')}
                  className="input"
                  placeholder={t('admin.createCompany.fields.hrManagerNamePlaceholder', { defaultValue: 'Enter HR manager name' })}
                />
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.hrPosition', { defaultValue: 'Position' })}</FieldLabel>
                <input
                  type="text"
                  {...register('recruiter.position')}
                  className="input"
                  placeholder={t('admin.createCompany.fields.hrPositionPlaceholder', { defaultValue: 'e.g. HR Manager' })}
                />
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.hrEmail', { defaultValue: 'Email' })}</FieldLabel>
                <input
                  type="email"
                  {...register('recruiter.email', { validate: validateEmail })}
                  className="input"
                  placeholder={t('admin.createCompany.fields.hrEmailPlaceholder', { defaultValue: 'recruiter@example.com' })}
                />
                <FieldError message={errors.recruiter?.email?.message} />
              </label>

              <label className="block">
                <FieldLabel>{t('admin.createCompany.fields.hrPhone', { defaultValue: 'Phone' })}</FieldLabel>
                <input
                  type="tel"
                  {...register('recruiter.phone', { validate: validatePhone })}
                  className="input"
                  placeholder={t('admin.createCompany.fields.hrPhonePlaceholder', { defaultValue: '+251 9XX XXX XXX' })}
                />
                <FieldError message={errors.recruiter?.phone?.message} />
              </label>
            </div>
          </section>

          {/* ── Section 5: Company Media & Documents ── */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 border-b border-slate-100 pb-3 dark:border-gray-700">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                {t('admin.createCompany.sections.media', { defaultValue: 'Company Media & Documents' })}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('admin.createCompany.sections.mediaDescription', { defaultValue: 'Upload the company logo and any related documents.' })}
              </p>
            </div>

            <div className="grid gap-6">
              <FileUploadField
                label={t('admin.createCompany.fields.logo', { defaultValue: 'Company Logo' })}
                required
                file={logoFile}
                onFileChange={(f) => {
                  setLogoFile(f);
                  if (f) setLogoError('');
                }}
                accept={IMAGE_ACCEPT}
                imageOnly
                maxSize={MAX_IMAGE_SIZE}
                helperText={t('admin.createCompany.upload.logoHelper', { defaultValue: 'Square image recommended. The logo appears on the company profile and job listings.' })}
              />
              {logoError && <p className="-mt-4 text-xs font-semibold text-red-600">{logoError}</p>}

              <FileUploadField
                label={t('admin.createCompany.fields.coverImage', { defaultValue: 'Cover Image' })}
                file={coverFile}
                onFileChange={setCoverFile}
                accept={IMAGE_ACCEPT}
                imageOnly
                maxSize={MAX_IMAGE_SIZE}
                helperText={t('admin.createCompany.upload.coverHelper', { defaultValue: 'Wide image recommended (16:9) for the company banner.' })}
              />

              <div className="grid gap-6 sm:grid-cols-3">
                <FileUploadField
                  label={t('admin.createCompany.fields.businessLicense', { defaultValue: 'Business License' })}
                  file={businessLicenseFile}
                  onFileChange={setBusinessLicenseFile}
                  accept={DOC_ACCEPT}
                  maxSize={MAX_DOC_SIZE}
                />
                <FileUploadField
                  label={t('admin.createCompany.fields.tinCertificate', { defaultValue: 'TIN Certificate' })}
                  file={tinCertificateFile}
                  onFileChange={setTinCertificateFile}
                  accept={DOC_ACCEPT}
                  maxSize={MAX_DOC_SIZE}
                />
                <FileUploadField
                  label={t('admin.createCompany.fields.registrationDocument', { defaultValue: 'Registration Document' })}
                  file={companyRegistrationFile}
                  onFileChange={setCompanyRegistrationFile}
                  accept={DOC_ACCEPT}
                  maxSize={MAX_DOC_SIZE}
                />
              </div>
            </div>
          </section>

          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{t('admin.createCompany.actions.uploading', { defaultValue: 'Uploading files...' })}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <FiX className="h-4 w-4" />
              {t('admin.createCompany.actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#1769E0]/20 transition hover:bg-[#0D5BC4] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {t('admin.createCompany.actions.saving', { defaultValue: 'Creating Company...' })}
                </>
              ) : (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  {t('admin.createCompany.actions.submit', { defaultValue: 'Create Company' })}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Preview sidebar ── */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-gray-700">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                {t('admin.createCompany.preview.title', { defaultValue: 'Company Preview' })}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('admin.createCompany.preview.subtitle', { defaultValue: 'Preview how the company information will appear.' })}
              </p>
            </div>

            <div className="space-y-5 p-6">
              {/* Logo + name */}
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-black text-emerald-700 dark:border-gray-700 dark:bg-gray-900">
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt={preview.name || 'Logo'} className="h-full w-full object-cover" />
                  ) : (
                    <FiBriefcase className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">{preview.name || notProvided}</h3>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">{preview.industry || notProvided}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                    <FiClock className="h-3 w-3" />
                    {t('admin.status.pending', { defaultValue: 'Pending' })}
                  </span>
                </div>
              </div>

              {/* Description */}
              {preview.description && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                  <p className="line-clamp-4 whitespace-pre-line">{preview.description}</p>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                <PreviewRow icon={FiGlobe} label={t('admin.createCompany.preview.website', { defaultValue: 'Website' })} value={preview.website} empty={notProvided} />
                <PreviewRow icon={FiMail} label={t('admin.createCompany.preview.email', { defaultValue: 'Email' })} value={preview.email} empty={notProvided} />
                <PreviewRow icon={FiPhone} label={t('admin.createCompany.preview.phone', { defaultValue: 'Phone' })} value={preview.phone} empty={notProvided} />
                <PreviewRow icon={FiMapPin} label={t('admin.createCompany.preview.location', { defaultValue: 'Location' })} value={previewLocation} empty={notProvided} />
              </div>

              {/* Recruiter */}
              <div className="border-t border-slate-100 pt-4 dark:border-gray-700">
                <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <FiUser className="h-3.5 w-3.5" />
                  {t('admin.createCompany.preview.recruiter', { defaultValue: 'Recruiter Contact' })}
                </h4>
                <div className="mt-3 space-y-2 text-sm">
                  <PreviewRow icon={FiUser} label={t('admin.createCompany.preview.contactName', { defaultValue: 'Contact Name' })} value={preview.recruiterName} empty={notProvided} />
                  <PreviewRow icon={FiBriefcase} label={t('admin.createCompany.preview.position', { defaultValue: 'Position' })} value={preview.recruiterPosition} empty={notProvided} />
                  <PreviewRow icon={FiMail} label={t('admin.createCompany.preview.email', { defaultValue: 'Email' })} value={preview.recruiterEmail} empty={notProvided} />
                  <PreviewRow icon={FiPhone} label={t('admin.createCompany.preview.phone', { defaultValue: 'Phone' })} value={preview.recruiterPhone} empty={notProvided} />
                </div>
              </div>
            </div>
          </section>

          {/* Helper tip */}
          <section className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FiStar className="h-4 w-4" />
            </span>
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              {t('admin.createCompany.preview.tip', { defaultValue: 'After submission, an admin will review and approve the company before it appears publicly.' })}
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
};

const PreviewRow = ({ icon: Icon, label, value, empty }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
    <p className="min-w-0 text-gray-600 dark:text-gray-300">
      <span className="font-semibold text-gray-800 dark:text-gray-100">{label}: </span>
      <span className={value ? 'break-words' : 'text-slate-400 italic'}>{value || empty}</span>
    </p>
  </div>
);

export default CreateCompany;
