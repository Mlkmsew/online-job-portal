import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { fetchEmployerCompany } from '../../../store/slices/employerSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { REGIONS, REGION_CITIES } from '../../../constants/locations';

const PostJob = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { company, loading: companyLoading } = useSelector((state) => state.employer);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

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
    }
  });

  const selectedRegion = watch('location.region');

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

  const onSubmit = async (data) => {
    if (!company) {
      toast.error('You must register a company profile before posting a job.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        company: company._id,
      };

      await api.post('/jobs', payload);
      toast.success('Job posted successfully!');
      navigate('/employer/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  if (companyLoading) {
    return <div className="text-center py-12">Loading company information...</div>;
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
      <h1 className="text-3xl font-bold mb-8">Post a New Job</h1>

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
