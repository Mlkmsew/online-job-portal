import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { getSavedSearches, createSavedSearch, updateSavedSearch, deleteSavedSearch, toggleSavedSearchNotification, getJobAlerts, createJobAlert, updateJobAlert, deleteJobAlert } from '../services/jobSearchService';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiBriefcase, FiClock, FiSearch, FiSliders, FiDollarSign, FiFilter, FiX } from 'react-icons/fi';
import { REGIONS, REGION_CITIES } from '../constants/locations';
import { useTranslation } from 'react-i18next';

const Jobs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [jobAlerts, setJobAlerts] = useState([]);
  const [showSavedSearchManager, setShowSavedSearchManager] = useState(false);
  const [showAlertManager, setShowAlertManager] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [internshipOnly, setInternshipOnly] = useState(false);
  const [deadlineWithinDays, setDeadlineWithinDays] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [sort, setSort] = useState('newest');

  // Seed filters from the incoming route query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('search') || '');
    setSelectedCategory(params.get('category') || '');
    setSelectedRegion(params.get('region') || '');
    setSelectedCity(params.get('city') || '');
    setJobType(params.get('jobType') || '');
    setWorkMode(params.get('workMode') || '');
    setExperienceLevel(params.get('experience') || '');
    setCompanyName(params.get('companyName') || '');
    setCompanyType(params.get('companyType') || '');
    setDeadlineWithinDays(params.get('deadlineWithinDays') || '');
    setMinSalary(params.get('minSalary') || '');
    setMaxSalary(params.get('maxSalary') || '');
  }, [location.search]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const res = await getSavedSearches();
        setSavedSearches(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch saved searches:', err);
      }
    };

    const loadJobAlerts = async () => {
      try {
        const res = await getJobAlerts();
        setJobAlerts(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch job alerts:', err);
      }
    };

    loadSavedSearches();
    loadJobAlerts();
  }, []);

  // Fetch Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = {
          sort,
        };
        if (search) params.search = search;
        if (companyName) params.companyName = companyName;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedRegion) params.region = selectedRegion;
        if (selectedCity) params.city = selectedCity;
        if (jobType) params.jobType = jobType;
        if (workMode) params.workMode = workMode;
        if (companyType) params.companyType = companyType;
        if (internshipOnly) params.internship = 'true';
        if (deadlineWithinDays) params.deadlineWithinDays = deadlineWithinDays;
        if (experienceLevel) params.experienceLevel = experienceLevel;
        if (minSalary) params.minSalary = minSalary;
        if (maxSalary) params.maxSalary = maxSalary;

        const res = await api.get('/jobs', { params });
        setJobs(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls slightly if searching
    const delayDebounce = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [
    search,
    selectedCategory,
    selectedRegion,
    selectedCity,
    jobType,
    workMode,
    experienceLevel,
    minSalary,
    maxSalary,
    sort,
    companyName,
    companyType,
    internshipOnly,
    deadlineWithinDays,
  ]);

  const getCurrentSearchQuery = () => ({
    search,
    category: selectedCategory,
    region: selectedRegion,
    city: selectedCity,
    jobType,
    workMode,
    experience: experienceLevel,
    companyName,
    companyType,
    internshipOnly,
    deadlineWithinDays,
    minSalary,
    maxSalary,
    sort,
  });

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedRegion('');
    setSelectedCity('');
    setJobType('');
    setWorkMode('');
    setExperienceLevel('');
    setCompanyName('');
    setCompanyType('');
    setInternshipOnly(false);
    setDeadlineWithinDays('');
    setMinSalary('');
    setMaxSalary('');
    setSort('newest');
  };

  const handleApplySavedSearch = (savedSearch) => {
    const q = savedSearch.query || {};
    setSearch(q.search || '');
    setSelectedCategory(q.category || '');
    setSelectedRegion(q.region || '');
    setSelectedCity(q.city || '');
    setJobType(q.jobType || '');
    setWorkMode(q.workMode || '');
    setExperienceLevel(q.experience || '');
    setCompanyName(q.companyName || '');
    setCompanyType(q.companyType || '');
    setInternshipOnly(q.internshipOnly || false);
    setDeadlineWithinDays(q.deadlineWithinDays || '');
    setMinSalary(q.minSalary || '');
    setMaxSalary(q.maxSalary || '');
    setSort(q.sort || 'newest');
    toast.success(`Applied saved search: ${savedSearch.name}`);
  };

  const refreshSavedSearches = async () => {
    try {
      const res = await getSavedSearches();
      setSavedSearches(res.data?.data || []);
    } catch (err) {
      console.error('Failed to refresh saved searches:', err);
    }
  };

  const refreshJobAlerts = async () => {
    try {
      const res = await getJobAlerts();
      setJobAlerts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to refresh job alerts:', err);
    }
  };

  const handleSaveNewSearch = async () => {
    const name = window.prompt('Save current search as:');
    if (!name) return;
    try {
      await createSavedSearch({ name, query: getCurrentSearchQuery(), notifyOnNewJobs: false });
      toast.success('Saved search created.');
      await refreshSavedSearches();
    } catch (err) {
      console.error('Failed to save search:', err);
    }
  };

  const handleToggleSavedSearchNotification = async (searchItem) => {
    try {
      const res = await toggleSavedSearchNotification(searchItem._id);
      setSavedSearches((prev) => prev.map((item) => (item._id === searchItem._id ? res.data.data : item)));
      toast.success(`Notifications ${res.data.data.notifyOnNewJobs ? 'enabled' : 'disabled'} for ${searchItem.name}`);
    } catch (err) {
      console.error('Failed to toggle saved search notifications:', err);
    }
  };

  const handleCreateJobAlert = async () => {
    const title = window.prompt('Create a new job alert name:');
    if (!title) return;
    try {
      await createJobAlert({
        title,
        region: selectedRegion || '',
        city: selectedCity || '',
        jobType: jobType || '',
        keywords: search || '',
        frequency: 'daily',
        active: true,
      });
      toast.success('Job alert created.');
      await refreshJobAlerts();
    } catch (err) {
      console.error('Failed to create job alert:', err);
    }
  };

  const handleToggleJobAlert = async (alertItem) => {
    try {
      const res = await updateJobAlert(alertItem._id, { active: !alertItem.active });
      setJobAlerts((prev) => prev.map((item) => (item._id === alertItem._id ? res.data.data : item)));
      toast.success(`${res.data.data.active ? 'Enabled' : 'Disabled'} alert: ${alertItem.title}`);
    } catch (err) {
      console.error('Failed to update job alert:', err);
    }
  };

  const handleDeleteSavedSearch = async (id) => {
    if (!window.confirm('Delete this saved search?')) return;
    try {
      await deleteSavedSearch(id);
      toast.success('Saved search deleted.');
      await refreshSavedSearches();
    } catch (err) {
      console.error('Failed to delete saved search:', err);
    }
  };

  const handleDeleteJobAlert = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await deleteJobAlert(id);
      toast.success('Job alert deleted.');
      await refreshJobAlerts();
    } catch (err) {
      console.error('Failed to delete job alert:', err);
    }
  };

  // Get cities based on selected region
  const availableCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Find Jobs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Explore job opportunities, save searches, and stay notified when the right role opens.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <FiX className="w-4 h-4" /> Reset
            </button>
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <FiSliders className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <main className="space-y-6">
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.9fr]">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search jobs, companies or skills"
                    className="input pl-11"
                  />
                </div>
                <div>
                  <label className="sr-only">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="sr-only">Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="select"
                  >
                    <option value="">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">{jobs.length.toLocaleString()} jobs available</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Search Jobs
                  </button>
                </div>
              </div>
            </div>

            {showMobileFilters && (
              <div className="block lg:hidden rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Region</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedCity('');
                      }}
                      className="select"
                    >
                      <option value="">All Regions</option>
                      {REGIONS.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="select"
                      disabled={!selectedRegion}
                    >
                      <option value="">All Cities</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Company</label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="input"
                      placeholder="Company name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      className="select"
                    >
                      <option value="">Company type</option>
                      <option value="Private">Private</option>
                      <option value="Government">Government</option>
                      <option value="NGO">NGO</option>
                      <option value="Startup">Startup</option>
                    </select>
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="select"
                    >
                      <option value="">Work mode</option>
                      <option value="on-site">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-40 rounded-[32px] border border-gray-200 bg-gray-100 shadow-sm animate-pulse dark:border-gray-800 dark:bg-gray-800"></div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-[32px] border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">No jobs matched your filters</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try changing your keywords, location or category to see more results.</p>
                <button onClick={handleResetFilters} className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link
                    key={job._id}
                    to={`/jobs/${job._id}`}
                    className="group block rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-600"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h3>
                          {job.isFeatured && (
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Featured</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{job.company?.name}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                            <FiMapPin className="h-4 w-4" />
                            {job.location?.city ? `${job.location.city}, ${job.location.region}` : job.location?.region || 'Remote'}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                            <FiBriefcase className="h-4 w-4" />
                            {job.jobType}
                          </span>
                          {job.salary?.min && job.salary?.max && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                              <FiDollarSign className="h-4 w-4" />
                              {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} ETB
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{job.category?.name || 'General'}</span>
                        <div className="flex flex-wrap gap-2">
                          {job.skillsRequired?.slice(0, 3).map((skill) => (
                            <span key={skill._id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">{skill.name}</span>
                          ))}
                        </div>
                        {job.applicationDeadline && (
                          <span className="text-sm text-red-500 flex items-center gap-1">
                            <FiClock /> Expires {new Date(job.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-700">
                          View Details
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Saved Searches</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Quickly return to searches you use most.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSavedSearchManager((prev) => !prev)}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {showSavedSearchManager ? 'Close' : 'Manage'}
                </button>
              </div>
              <div className="space-y-3">
                {savedSearches.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950">
                    No saved searches yet. Create one to reuse your filters quickly.
                  </div>
                ) : (
                  savedSearches.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleApplySavedSearch(item)}
                      className="group w-full rounded-3xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-950"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.query?.search || 'Saved filter'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSavedSearchNotification(item);
                            }}
                            className={`h-9 w-9 rounded-full ${item.notifyOnNewJobs ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'} transition`}
                          >
                            🔔
                          </button>
                          {showSavedSearchManager && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSavedSearch(item._id);
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveNewSearch}
                className="mt-4 w-full rounded-full bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                + Save new search
              </button>
            </div>

            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Job Alerts</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when relevant roles are posted.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlertManager((prev) => !prev)}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {showAlertManager ? 'Close' : 'Manage'}
                </button>
              </div>
              <div className="space-y-3">
                {jobAlerts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950">
                    No alerts configured yet. Create one to receive updates.
                  </div>
                ) : (
                  jobAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className="flex items-center justify-between rounded-3xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{alert.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {alert.jobType || 'Any role'}{alert.region ? ` • ${alert.region}` : ''}{alert.city ? ` • ${alert.city}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleJobAlert(alert)}
                          className={`h-9 w-20 rounded-full text-sm font-semibold transition ${alert.active ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'}`}
                        >
                          {alert.active ? 'On' : 'Off'}
                        </button>
                        {showAlertManager && (
                          <button
                            type="button"
                            onClick={() => handleDeleteJobAlert(alert._id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={handleCreateJobAlert}
                className="mt-4 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + Create new alert
              </button>
            </div>

            <div className="rounded-[32px] border border-gray-200 bg-emerald-50 p-6 shadow-sm dark:border-gray-800 dark:bg-emerald-950/20">
              <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-100">Boost your profile</h2>
              <p className="mt-3 text-sm text-emerald-900 dark:text-emerald-200">Complete your profile and add skills to improve matching and visibility.</p>
              <button className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-gray-100">
                Complete profile
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
