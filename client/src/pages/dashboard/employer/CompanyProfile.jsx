import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployerCompany } from '../../../store/slices/employerSlice';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { REGIONS, REGION_CITIES } from '../../../constants/locations';
import { FiBriefcase, FiMapPin, FiMail, FiPhone, FiGlobe, FiPlus, FiCheckCircle } from 'react-icons/fi';

const CompanyProfile = () => {
  const dispatch = useDispatch();
  const { company, loading } = useSelector((state) => state.employer);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      location: {
        region: '',
        city: '',
      },
      companySize: '1-10'
    }
  });

  const selectedRegion = watch('location.region');

  useEffect(() => {
    dispatch(fetchEmployerCompany());
  }, [dispatch]);

  const onSubmit = async (data) => {
    setCreating(true);
    try {
      await api.post('/companies', data);
      toast.success('Company profile submitted for approval!');
      dispatch(fetchEmployerCompany());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create company profile.');
    } finally {
      setCreating(false);
    }
  };

  const selectedCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="card animate-pulse h-28 bg-gray-100 dark:bg-gray-800"></div>
        <div className="card animate-pulse h-96 bg-gray-100 dark:bg-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="card">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FiBriefcase className="text-primary-500" /> Company Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update your company details, industry type, and contact information.
        </p>
      </div>

      {company ? (
        <div className="space-y-6">
          {/* Status Alert */}
          <div className="card border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-950/20 p-4 flex items-start gap-3">
            <FiCheckCircle className="text-primary-500 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Company Status: {company.isApproved ? 'Approved & Active' : 'Pending Verification'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {company.isApproved 
                  ? 'Your company is verified. You can post and manage active job listings.'
                  : 'Your profile has been created and is waiting for administrator approval.'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <h2 className="text-lg font-bold border-b pb-2 mb-3">Company Details</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{company.name}</p>
                
                <p className="text-sm text-gray-500 pt-2">Industry</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{company.industry || 'Not set'}</p>

                <p className="text-sm text-gray-500 pt-2">Company Size</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{company.companySize || 'Not set'}</p>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold border-b pb-2 mb-3">Location & Contact</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base flex items-center gap-1">
                  <FiMapPin className="text-gray-400" />
                  {company.location?.city ? `${company.location.city}, ` : ''}{company.location?.region || 'Region not set'}
                </p>

                <p className="text-sm text-gray-500 pt-2">Email Address</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base flex items-center gap-1">
                  <FiMail className="text-gray-400" /> {company.email || 'Email not set'}
                </p>

                <p className="text-sm text-gray-500 pt-2">Phone Number</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base flex items-center gap-1">
                  <FiPhone className="text-gray-400" /> {company.phone || 'Phone not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold border-b pb-2 mb-3">Company Biography</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {company.description || 'No detailed description available.'}
            </p>
          </div>
        </div>
      ) : (
        /* Create Company Form */
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FiPlus className="text-primary-500" /> Create Company Profile
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Company Name</label>
              <input
                type="text"
                {...register('name', { required: 'Company name is required' })}
                className="input"
                placeholder="e.g. Ethiopian Software Solutions"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Industry</label>
                <input
                  type="text"
                  {...register('industry', { required: 'Industry is required' })}
                  className="input"
                  placeholder="e.g. Technology, Agriculture"
                />
                {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Company Size</label>
                <select {...register('companySize')} className="select">
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001-5000">1001-5000 employees</option>
                  <option value="5000+">5000+ employees</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Region</label>
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
                <label className="block text-sm font-semibold mb-1">City</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email address is required' })}
                  className="input"
                  placeholder="contact@company.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input"
                  placeholder="e.g. +251 911 123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Website URL</label>
              <input
                type="url"
                {...register('website')}
                className="input"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">About / Bio</label>
              <textarea
                {...register('description', { required: 'Company bio is required' })}
                className="textarea"
                rows="5"
                placeholder="Describe your company culture, mission, and products..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="btn btn-primary w-full md:w-auto"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Company Profile'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;
