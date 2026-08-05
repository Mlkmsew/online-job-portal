import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployerCompany } from '../../../store/slices/employerSlice';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { REGIONS, REGION_CITIES } from '../../../constants/locations';
import {
  FiBriefcase,
  FiMapPin,
  FiMail,
  FiPhone,
  FiGlobe,
  FiUpload,
  FiCheckCircle,
  FiArrowRight,
  FiUploadCloud,
  FiFileText,
  FiEye,
  FiX,
  FiFacebook,
  FiLinkedin,
  FiInstagram,
  FiSend,
} from 'react-icons/fi';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
const FOUNDED_YEARS = Array.from({ length: 50 }, (_, index) => new Date().getFullYear() - index);

const EMPTY_FORM_VALUES = {
  name: '',
  description: '',
  industry: '',
  companySize: '1-10',
  foundedYear: '',
  companyType: 'Private',
  website: '',
  email: '',
  phone: '',
  location: {
    region: '',
    city: '',
    address: '',
  },
  socialLinks: {
    linkedin: '',
    facebook: '',
    telegram: '',
    instagram: '',
  },
  recruiter: {
    hrManagerName: '',
    position: '',
    email: '',
    phone: '',
  },
  documents: {
    businessLicense: '',
    tinCertificate: '',
    companyRegistration: '',
  },
};

const getFormValues = (company = {}) => ({
  name: company.name || '',
  description: company.description || '',
  industry: company.industry || '',
  companySize: company.companySize || '1-10',
  foundedYear: company.foundedYear?.toString() || '',
  companyType: company.companyType || 'Private',
  website: company.website || '',
  email: company.email || '',
  phone: company.phone || '',
  location: {
    region: company.location?.region || '',
    city: company.location?.city || '',
    address: company.location?.address || '',
  },
  socialLinks: {
    linkedin: company.socialLinks?.linkedin || '',
    facebook: company.socialLinks?.facebook || '',
    telegram: company.socialLinks?.telegram || '',
    instagram: company.socialLinks?.instagram || '',
  },
  recruiter: {
    hrManagerName: company.recruiter?.hrManagerName || '',
    position: company.recruiter?.position || '',
    email: company.recruiter?.email || '',
    phone: company.recruiter?.phone || '',
  },
  documents: {
    businessLicense: company.businessLicense || '',
    tinCertificate: company.tinCertificate || '',
    companyRegistration: company.companyRegistration || '',
  },
});

const CompanyProfile = () => {
  const dispatch = useDispatch();
  const { company, loading } = useSelector((state) => state.employer);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [tinCertificateFile, setTinCertificateFile] = useState(null);
  const [companyRegistrationFile, setCompanyRegistrationFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [businessLicensePreview, setBusinessLicensePreview] = useState('');
  const [businessLicensePreviewType, setBusinessLicensePreviewType] = useState('');
  const [businessLicensePreviewMime, setBusinessLicensePreviewMime] = useState('');
  const [tinCertificatePreview, setTinCertificatePreview] = useState('');
  const [tinCertificatePreviewType, setTinCertificatePreviewType] = useState('');
  const [tinCertificatePreviewMime, setTinCertificatePreviewMime] = useState('');
  const [companyRegistrationPreview, setCompanyRegistrationPreview] = useState('');
  const [companyRegistrationPreviewType, setCompanyRegistrationPreviewType] = useState('');
  const [companyRegistrationPreviewMime, setCompanyRegistrationPreviewMime] = useState('');
  const [previewModal, setPreviewModal] = useState({ open: false, title: '', url: '', type: '', mime: '' });

  const openPreviewModal = (title, url, type, mime = '') => setPreviewModal({ open: true, title, url, type, mime });
  const closePreviewModal = () => setPreviewModal({ open: false, title: '', url: '', type: '', mime: '' });
  const getDocumentName = (file, url) => file?.name || (typeof url === 'string' ? url.split('/').pop() : 'Document');
  const isPreviewableDocument = (type, mime, url) => {
    if (type === 'image') return true;
    if (mime === 'application/pdf') return true;
    return typeof url === 'string' && /\.pdf$/i.test(url);
  };
  const openDocumentPreview = (title, url, type, mime = '') => {
    if (!url) return;
    if (isPreviewableDocument(type, mime, url)) {
      openPreviewModal(title, url, type, mime);
    } else {
      window.open(url, '_blank');
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_FORM_VALUES,
  });

  const selectedRegion = watch('location.region');
  const watchedFields = watch([
    'name',
    'description',
    'industry',
    'companySize',
    'foundedYear',
    'companyType',
    'website',
    'email',
    'phone',
    'location.region',
    'location.city',
    'location.address',
    'socialLinks.linkedin',
    'socialLinks.facebook',
    'socialLinks.telegram',
    'socialLinks.instagram',
    'recruiter.hrManagerName',
    'recruiter.position',
    'recruiter.email',
    'recruiter.phone',
    'documents.businessLicense',
    'documents.tinCertificate',
    'documents.companyRegistration',
  ]);

  const selectedCities = useMemo(
    () => (selectedRegion ? REGION_CITIES[selectedRegion] || [] : []),
    [selectedRegion]
  );

  const formPreview = watch();

  const getPreviewValue = (fieldValue, companyValue, fallback = '') =>
    fieldValue !== undefined && fieldValue !== '' ? fieldValue : companyValue || fallback;

  const preview = {
    name: getPreviewValue(formPreview.name, company?.name, 'Company name not set'),
    industry: getPreviewValue(formPreview.industry, company?.industry, 'Industry not set'),
    companySize: getPreviewValue(formPreview.companySize, company?.companySize, 'Size not set'),
    foundedYear: getPreviewValue(formPreview.foundedYear, company?.foundedYear, 'Founded year not set'),
    companyType: getPreviewValue(formPreview.companyType, company?.companyType, 'Private'),
    website: getPreviewValue(formPreview.website, company?.website, 'Website not set'),
    email: getPreviewValue(formPreview.email, company?.email, 'Email not set'),
    phone: getPreviewValue(formPreview.phone, company?.phone, 'Phone not set'),
    locationRegion: getPreviewValue(formPreview.location?.region, company?.location?.region, 'Region not set'),
    locationCity: getPreviewValue(formPreview.location?.city, company?.location?.city, ''),
    socialLinks: {
      linkedin: getPreviewValue(formPreview.socialLinks?.linkedin, company?.socialLinks?.linkedin, ''),
      facebook: getPreviewValue(formPreview.socialLinks?.facebook, company?.socialLinks?.facebook, ''),
      telegram: getPreviewValue(formPreview.socialLinks?.telegram, company?.socialLinks?.telegram, ''),
      instagram: getPreviewValue(formPreview.socialLinks?.instagram, company?.socialLinks?.instagram, ''),
    },
    recruiter: {
      hrManagerName: getPreviewValue(formPreview.recruiter?.hrManagerName, company?.recruiter?.hrManagerName, 'HR Manager not set'),
      position: getPreviewValue(formPreview.recruiter?.position, company?.recruiter?.position, 'Position not set'),
      email: getPreviewValue(formPreview.recruiter?.email, company?.recruiter?.email, 'Email not set'),
      phone: getPreviewValue(formPreview.recruiter?.phone, company?.recruiter?.phone, 'Phone not set'),
    },
    businessLicense: businessLicenseFile ? businessLicenseFile.name : company?.businessLicense ? company.businessLicense.split('/').pop() : '',
    tinCertificate: tinCertificateFile ? tinCertificateFile.name : company?.tinCertificate ? company.tinCertificate.split('/').pop() : '',
    companyRegistration: companyRegistrationFile ? companyRegistrationFile.name : company?.companyRegistration ? company.companyRegistration.split('/').pop() : '',
  };

  const completionPercent = useMemo(() => {
    const filled = watchedFields.filter((value) => !!value).length;
    return Math.round((filled / watchedFields.length) * 100);
  }, [watchedFields]);

  useEffect(() => {
    dispatch(fetchEmployerCompany());
  }, [dispatch]);

  useEffect(() => {
    if (company) {
      reset(getFormValues(company));
      setIsEditing(false);
      setLogoPreview(company.logo || '');
      setCoverPreview(company.coverImage || '');
    } else {
      reset(EMPTY_FORM_VALUES);
      setIsEditing(true);
      setLogoPreview('');
      setCoverPreview('');
    }
  }, [company, reset]);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (company?.logo) {
      setLogoPreview(company.logo);
    }
  }, [logoFile, company]);

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (company?.coverImage) {
      setCoverPreview(company.coverImage);
    }
  }, [coverFile, company]);

  useEffect(() => {
    if (businessLicenseFile) {
      const url = URL.createObjectURL(businessLicenseFile);
      setBusinessLicensePreview(url);
      setBusinessLicensePreviewType(businessLicenseFile.type.startsWith('image/') ? 'image' : 'document');
      setBusinessLicensePreviewMime(businessLicenseFile.type);
      return () => URL.revokeObjectURL(url);
    }

    if (company?.businessLicense) {
      const url = company.businessLicense;
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
      setBusinessLicensePreview(url);
      setBusinessLicensePreviewType(isImage ? 'image' : 'document');
      setBusinessLicensePreviewMime(/\.pdf$/i.test(url) ? 'application/pdf' : '');
    } else {
      setBusinessLicensePreview('');
      setBusinessLicensePreviewType('');
      setBusinessLicensePreviewMime('');
    }
  }, [businessLicenseFile, company]);

  useEffect(() => {
    if (tinCertificateFile) {
      const url = URL.createObjectURL(tinCertificateFile);
      setTinCertificatePreview(url);
      setTinCertificatePreviewType(tinCertificateFile.type.startsWith('image/') ? 'image' : 'document');
      setTinCertificatePreviewMime(tinCertificateFile.type);
      return () => URL.revokeObjectURL(url);
    }

    if (company?.tinCertificate) {
      const url = company.tinCertificate;
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
      setTinCertificatePreview(url);
      setTinCertificatePreviewType(isImage ? 'image' : 'document');
      setTinCertificatePreviewMime(/\.pdf$/i.test(url) ? 'application/pdf' : '');
    } else {
      setTinCertificatePreview('');
      setTinCertificatePreviewType('');
      setTinCertificatePreviewMime('');
    }
  }, [tinCertificateFile, company]);

  useEffect(() => {
    if (companyRegistrationFile) {
      const url = URL.createObjectURL(companyRegistrationFile);
      setCompanyRegistrationPreview(url);
      setCompanyRegistrationPreviewType(companyRegistrationFile.type.startsWith('image/') ? 'image' : 'document');
      setCompanyRegistrationPreviewMime(companyRegistrationFile.type);
      return () => URL.revokeObjectURL(url);
    }

    if (company?.companyRegistration) {
      const url = company.companyRegistration;
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
      setCompanyRegistrationPreview(url);
      setCompanyRegistrationPreviewType(isImage ? 'image' : 'document');
      setCompanyRegistrationPreviewMime(/\.pdf$/i.test(url) ? 'application/pdf' : '');
    } else {
      setCompanyRegistrationPreview('');
      setCompanyRegistrationPreviewType('');
      setCompanyRegistrationPreviewMime('');
    }
  }, [companyRegistrationFile, company]);

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

    appendValue('name', data.name || '');
    appendValue('description', data.description || '');
    appendValue('industry', data.industry || '');
    appendValue('companySize', data.companySize || '');
    appendValue('foundedYear', data.foundedYear || '');
    appendValue('companyType', data.companyType || '');
    appendValue('website', data.website || '');
    appendValue('email', data.email || '');
    appendValue('phone', data.phone || '');
    appendValue('location', data.location || {});
    appendValue('socialLinks', data.socialLinks || {});
    appendValue('recruiter', data.recruiter || {});

    if (logoFile) {
      formData.append('logo', logoFile);
    }
    if (coverFile) {
      formData.append('coverImage', coverFile);
    }
    if (businessLicenseFile) {
      formData.append('businessLicense', businessLicenseFile);
    }
    if (tinCertificateFile) {
      formData.append('tinCertificate', tinCertificateFile);
    }
    if (companyRegistrationFile) {
      formData.append('companyRegistration', companyRegistrationFile);
    }

    if (data.documents.businessLicense && !businessLicenseFile) {
      appendValue('businessLicense', data.documents.businessLicense);
    }
    if (data.documents.tinCertificate && !tinCertificateFile) {
      appendValue('tinCertificate', data.documents.tinCertificate);
    }
    if (data.documents.companyRegistration && !companyRegistrationFile) {
      appendValue('companyRegistration', data.documents.companyRegistration);
    }

    return formData;
  };

  const onSubmit = async (data) => {
    if (!company && !logoFile) {
      toast.error('Please upload a company logo before submitting.');
      return;
    }

    setSaving(true);
    try {
      const formData = buildFormData(data);
      const url = company ? `/companies/${company._id}` : '/companies';
      const method = company ? api.put : api.post;
      await method(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(company ? 'Company profile updated successfully.' : 'Company profile submitted for approval!');
      dispatch(fetchEmployerCompany());
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      reset(getFormValues(company));
      setIsEditing(false);
      setLogoFile(null);
      setCoverFile(null);
      setBusinessLicenseFile(null);
      setTinCertificateFile(null);
      setCompanyRegistrationFile(null);
      setBusinessLicensePreview(company.businessLicense || '');
      setBusinessLicensePreviewType(company.businessLicense ? (/(png|jpe?g|gif|webp|svg)$/i.test(company.businessLicense) ? 'image' : 'document') : '');
      setBusinessLicensePreviewMime(company.businessLicense && /\.pdf$/i.test(company.businessLicense) ? 'application/pdf' : '');
      setTinCertificatePreview(company.tinCertificate || '');
      setTinCertificatePreviewType(company.tinCertificate ? (/(png|jpe?g|gif|webp|svg)$/i.test(company.tinCertificate) ? 'image' : 'document') : '');
      setTinCertificatePreviewMime(company.tinCertificate && /\.pdf$/i.test(company.tinCertificate) ? 'application/pdf' : '');
      setCompanyRegistrationPreview(company.companyRegistration || '');
      setCompanyRegistrationPreviewType(company.companyRegistration ? (/(png|jpe?g|gif|webp|svg)$/i.test(company.companyRegistration) ? 'image' : 'document') : '');
      setCompanyRegistrationPreviewMime(company.companyRegistration && /\.pdf$/i.test(company.companyRegistration) ? 'application/pdf' : '');
    } else {
      reset(EMPTY_FORM_VALUES);
      setLogoFile(null);
      setCoverFile(null);
      setBusinessLicenseFile(null);
      setTinCertificateFile(null);
      setCompanyRegistrationFile(null);
      setLogoPreview('');
      setCoverPreview('');
      setBusinessLicensePreview('');
      setBusinessLicensePreviewType('');
      setTinCertificatePreview('');
      setTinCertificatePreviewType('');
      setCompanyRegistrationPreview('');
      setCompanyRegistrationPreviewType('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="card animate-pulse h-28 bg-gray-100 dark:bg-gray-800"></div>
        <div className="grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
          <div className="card animate-pulse h-[650px] bg-gray-100 dark:bg-gray-800"></div>
          <div className="card animate-pulse h-[650px] bg-gray-100 dark:bg-gray-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary-600">Employer Profile / Company Profile</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Employer Company Profile
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              Manage your company branding, contact details, social links, recruiter contact, and verification documents.
            </p>
          </div>

          <div className="badge badge-primary">
            {completionPercent}% complete
          </div>
        </div>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company Branding</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upload logo and cover image, then add your company basics.</p>
                </div>
                {company && !isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline"
                  >
                    Edit Profile
                  </button>
                ) : null}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-900">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-gray-800">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Company logo preview" className="h-20 w-20 object-contain" />
                    ) : (
                      <FiUploadCloud className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Company Logo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, SVG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    disabled={!isEditing}
                    className="mx-auto block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  {logoPreview && isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview('');
                      }}
                      className="btn btn-outline w-full"
                    >
                      Remove / Replace Logo
                    </button>
                  )}
                </div>

                <div className="space-y-4 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="h-36 overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-gray-800">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Company cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <FiUploadCloud className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Cover Image</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Optional, adds polish to your public profile.</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    disabled={!isEditing}
                    className="mx-auto block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  {coverPreview && isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview('');
                      }}
                      className="btn btn-outline w-full"
                    >
                      Remove / Replace Cover
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">Company Name</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Company name is required' })}
                    disabled={!isEditing}
                    className="input"
                    placeholder="E.g. Emare Ict Hub"
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Industry</label>
                  <input
                    type="text"
                    {...register('industry')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="E.g. Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Company Size</label>
                  <select
                    {...register('companySize')}
                    disabled={!isEditing}
                    className="select"
                  >
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Founded Year</label>
                  <select
                    {...register('foundedYear')}
                    disabled={!isEditing}
                    className="select"
                  >
                    <option value="">Select year</option>
                    {FOUNDED_YEARS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Primary company contact details.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    {...register('phone')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="+251911123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Website</label>
                  <input
                    type="url"
                    {...register('website')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Region</label>
                  <select
                    {...register('location.region')}
                    disabled={!isEditing}
                    className="select"
                    onChange={(e) => {
                      register('location.region').onChange(e);
                      setValue('location.city', '');
                    }}
                  >
                    <option value="">Choose region</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">City</label>
                  <select
                    {...register('location.city')}
                    disabled={!isEditing || !selectedRegion}
                    className="select"
                  >
                    <option value="">Choose city</option>
                    {selectedCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Address</label>
                  <input
                    type="text"
                    {...register('location.address')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="Street address"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Social Media</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add links for company visibility.</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">LinkedIn</label>
                  <input
                    type="url"
                    {...register('socialLinks.linkedin')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="https://linkedin.com/company/example"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Facebook</label>
                  <input
                    type="url"
                    {...register('socialLinks.facebook')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="https://facebook.com/example"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Telegram</label>
                  <input
                    type="url"
                    {...register('socialLinks.telegram')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="https://t.me/example"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Instagram</label>
                  <input
                    type="url"
                    {...register('socialLinks.instagram')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="https://instagram.com/example"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recruiter Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">HR or recruiter contact details for your company.</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">HR Manager Name</label>
                  <input
                    type="text"
                    {...register('recruiter.hrManagerName')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="E.g. Sara Bekele"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Position</label>
                  <input
                    type="text"
                    {...register('recruiter.position')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="E.g. HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Recruiter Email</label>
                  <input
                    type="email"
                    {...register('recruiter.email')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="hr@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Recruiter Phone</label>
                  <input
                    type="tel"
                    {...register('recruiter.phone')}
                    disabled={!isEditing}
                    className="input"
                    placeholder="+251911123456"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Documents</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload business documents used for verification.</p>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold">Business License</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setBusinessLicenseFile(file);
                      setValue('documents.businessLicense', file?.name || '');
                    }}
                    disabled={!isEditing}
                    className="input"
                  />
                  {businessLicensePreview ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{getDocumentName(businessLicenseFile, company?.businessLicense)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {businessLicensePreviewType === 'image' ? 'Image document ready' : 'Document ready'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview('Business License', businessLicensePreview, businessLicensePreviewType, businessLicensePreviewMime)}
                            className="btn btn-outline flex items-center gap-2"
                          >
                            <FiEye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessLicenseFile(null);
                              setValue('documents.businessLicense', '');
                              setBusinessLicensePreview('');
                              setBusinessLicensePreviewType('');
                            }}
                            disabled={!isEditing}
                            className="btn btn-outline"
                          >
                            Remove / Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No document uploaded yet.</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold">TIN Certificate</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTinCertificateFile(file);
                      setValue('documents.tinCertificate', file?.name || '');
                    }}
                    disabled={!isEditing}
                    className="input"
                  />
                  {tinCertificatePreview ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{getDocumentName(tinCertificateFile, company?.tinCertificate)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tinCertificatePreviewType === 'image' ? 'Image document ready' : 'Document ready'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview('TIN Certificate', tinCertificatePreview, tinCertificatePreviewType, tinCertificatePreviewMime)}
                            className="btn btn-outline flex items-center gap-2"
                          >
                            <FiEye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTinCertificateFile(null);
                              setValue('documents.tinCertificate', '');
                              setTinCertificatePreview('');
                              setTinCertificatePreviewType('');
                            }}
                            disabled={!isEditing}
                            className="btn btn-outline"
                          >
                            Remove / Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No document uploaded yet.</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold">Company Registration</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCompanyRegistrationFile(file);
                      setValue('documents.companyRegistration', file?.name || '');
                    }}
                    disabled={!isEditing}
                    className="input"
                  />
                  {companyRegistrationPreview ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{getDocumentName(companyRegistrationFile, company?.companyRegistration)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {companyRegistrationPreviewType === 'image' ? 'Image document ready' : 'Document ready'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDocumentPreview('Company Registration', companyRegistrationPreview, companyRegistrationPreviewType, companyRegistrationPreviewMime)}
                            className="btn btn-outline flex items-center gap-2"
                          >
                            <FiEye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyRegistrationFile(null);
                              setValue('documents.companyRegistration', '');
                              setCompanyRegistrationPreview('');
                              setCompanyRegistrationPreviewType('');
                            }}
                            disabled={!isEditing}
                            className="btn btn-outline"
                          >
                            Remove / Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No document uploaded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {previewModal.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-950">
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{previewModal.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{previewModal.type === 'image' ? 'Image preview' : 'Document preview'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closePreviewModal}
                      className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:text-gray-300"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="max-h-[80vh] overflow-auto bg-black/5 p-4 dark:bg-gray-900">
                    {previewModal.type === 'image' ? (
                      <img src={previewModal.url} alt={previewModal.title} className="mx-auto w-full rounded-3xl object-contain" />
                    ) : previewModal.mime === 'application/pdf' ? (
                      <iframe
                        title={previewModal.title}
                        src={previewModal.url}
                        className="h-[70vh] w-full rounded-3xl border border-gray-200 bg-white dark:border-gray-700"
                      />
                    ) : (
                      <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-950">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">This document type cannot be previewed inline.</p>
                        <a href={previewModal.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                          Open in new tab
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Ready to save your employer profile?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your changes are saved through a secure update request.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {company && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={!isEditing || saving}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isEditing || saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : company ? 'Save Changes' : 'Create Company Profile'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="sticky top-28 space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">Live Preview</p>
                <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{preview.name}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{preview.industry}</p>
              </div>
              <span className={(company?.isApproved || company?.isApproved === false) ? (company?.isApproved ? 'badge badge-success' : 'badge badge-warning') : 'badge badge-warning'}>
                {company?.isApproved ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-900">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="h-28 w-full object-cover" />
              ) : (
                <div className="h-28 w-full bg-gray-100 dark:bg-gray-900" />
              )}
              <div className="absolute left-5 top-16 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-white shadow-lg dark:border-gray-950 dark:bg-gray-950">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-900" />
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{preview.name}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  {preview.industry} • {preview.companySize} • {preview.foundedYear}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="text-primary-500" />
                <span>{preview.locationCity ? `${preview.locationCity}, ` : ''}{preview.locationRegion}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiGlobe className="text-primary-500" />
                <span>{preview.website}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="text-primary-500" />
                <span>{preview.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-primary-500" />
                <span>{preview.phone}</span>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Social</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.socialLinks.linkedin ? (
                    <a href={preview.socialLinks.linkedin} target="_blank" rel="noreferrer" className="badge badge-outline flex items-center gap-2">
                      <FiLinkedin className="h-4 w-4" /> LinkedIn
                    </a>
                  ) : null}
                  {preview.socialLinks.facebook ? (
                    <a href={preview.socialLinks.facebook} target="_blank" rel="noreferrer" className="badge badge-outline flex items-center gap-2">
                      <FiFacebook className="h-4 w-4" /> Facebook
                    </a>
                  ) : null}
                  {preview.socialLinks.telegram ? (
                    <a href={preview.socialLinks.telegram} target="_blank" rel="noreferrer" className="badge badge-outline flex items-center gap-2">
                      <FiSend className="h-4 w-4" /> Telegram
                    </a>
                  ) : null}
                  {preview.socialLinks.instagram ? (
                    <a href={preview.socialLinks.instagram} target="_blank" rel="noreferrer" className="badge badge-outline flex items-center gap-2">
                      <FiInstagram className="h-4 w-4" /> Instagram
                    </a>
                  ) : null}
                  {!preview.socialLinks.linkedin && !preview.socialLinks.facebook && !preview.socialLinks.telegram && !preview.socialLinks.instagram && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">No social links added</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Recruiter</p>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{preview.recruiter.hrManagerName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{preview.recruiter.position}</p>
                <div className="mt-3 space-y-2">
                  <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiMail className="text-primary-500" />
                    {preview.recruiter.email}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiPhone className="text-primary-500" />
                    {preview.recruiter.phone}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Verification Documents</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {preview.businessLicense ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview('Business License', businessLicensePreview, businessLicensePreviewType, businessLicensePreviewMime)}
                      className="w-full min-w-0 overflow-hidden break-words whitespace-normal rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300 sm:text-[11px]"
                    >
                      {`License: ${preview.businessLicense}`}
                    </button>
                  ) : (
                    <span className="w-full min-w-0 overflow-hidden break-words whitespace-normal rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 sm:text-[11px]">
                      License Pending ⏳
                    </span>
                  )}
                  {preview.tinCertificate ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview('TIN Certificate', tinCertificatePreview, tinCertificatePreviewType, tinCertificatePreviewMime)}
                      className="w-full min-w-0 overflow-hidden break-words whitespace-normal rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300 sm:text-[11px]"
                    >
                      {`TIN: ${preview.tinCertificate}`}
                    </button>
                  ) : (
                    <span className="w-full min-w-0 overflow-hidden break-words whitespace-normal rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 sm:text-[11px]">
                      TIN Pending ⏳
                    </span>
                  )}
                  {preview.companyRegistration ? (
                    <button
                      type="button"
                      onClick={() => openDocumentPreview('Company Registration', companyRegistrationPreview, companyRegistrationPreviewType, companyRegistrationPreviewMime)}
                      className="w-full min-w-0 overflow-hidden break-words whitespace-normal rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-300 sm:text-[11px]"
                    >
                      {`Registration: ${preview.companyRegistration}`}
                    </button>
                  ) : (
                    <span className="w-full min-w-0 overflow-hidden break-words whitespace-normal rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 sm:text-[11px]">
                      Registration Pending ⏳
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
};

export default CompanyProfile;
