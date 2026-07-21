import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
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

  // Get cities based on selected region
  const availableCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  return (
    <div className="section container-custom">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-1/4 space-y-6">
          <div className="card sticky top-24">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiFilter className="text-primary-500" /> {t('common.filter')}
              </h2>
              <button 
                onClick={handleResetFilters}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                {t('common.clearAll')}
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.category')}</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="select"
                >
                  <option value="">{t('jobs.allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.region')}</label>
                <select 
                  value={selectedRegion} 
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedCity(''); // Reset city uoon region change
                  }}
                  className="select"
                >
                  <option value="">{t('jobs.allRegions')}</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.city')}</label>
                <select 
                  value={selectedCity} 
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="select"
                  disabled={!selectedRegion}
                >
                  <option value="">{t('jobs.allCities')}</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.company')}</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('jobs.companyName')}
                  className="input"
                />
              </div>

              {/* Company Type */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.companyType')}</label>
                <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="select">
                  <option value="">{t('jobs.allTypes')}</option>
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="NGO">NGO</option>
                  <option value="Startup">Startup</option>
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.jobType')}</label>
                <select 
                  value={jobType} 
                  onChange={(e) => setJobType(e.target.value)}
                  className="select"
                >
                  <option value="">{t('jobs.allTypes')}</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              {/* Internship only */}
              <div className="flex items-center gap-2">
                <input id="internshipOnly" type="checkbox" checked={internshipOnly} onChange={(e) => setInternshipOnly(e.target.checked)} />
                <label htmlFor="internshipOnly" className="text-sm font-medium">{t('jobs.internshipOnly')}</label>
              </div>

              {/* Fresh Graduate only */}
              <div className="flex items-center gap-2">
                <input 
                  id="freshGraduateOnly" 
                  type="checkbox" 
                  checked={experienceLevel === 'Entry Level'} 
                  onChange={(e) => setExperienceLevel(e.target.checked ? 'Entry Level' : '')} 
                />
                <label htmlFor="freshGraduateOnly" className="text-sm font-medium text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                  {t('jobs.freshGraduate')}
                </label>
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.workMode')}</label>
                <select 
                  value={workMode} 
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="select"
                >
                  <option value="">{t('jobs.allModes')}</option>
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.experience')}</label>
                <select 
                  value={experienceLevel} 
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="select"
                >
                  <option value="">{t('jobs.anyExperience')}</option>
                  <option value="Entry Level">Entry Level (0-2 years)</option>
                  <option value="Mid Level">Mid Level (2-5 years)</option>
                  <option value="Senior Level">Senior Level (5+ years)</option>
                  <option value="Lead">Lead / Manager</option>
                </select>
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.salaryRange')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t('jobs.min')}
                    className="input py-1.5"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t('jobs.max')}
                    className="input py-1.5"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                  />
                </div>
              </div>

              {/* Deadline within days */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('jobs.deadlineWithin')}</label>
                <select value={deadlineWithinDays} onChange={(e) => setDeadlineWithinDays(e.target.value)} className="select">
                  <option value="">{t('jobs.any')}</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm p-6 overflow-y-auto flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">{t('common.filter')}</h2>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.category')}</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select"
                  >
                    <option value="">{t('jobs.allCategories')}</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.region')}</label>
                  <select 
                    value={selectedRegion} 
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedCity('');
                    }}
                    className="select"
                  >
                    <option value="">{t('jobs.allRegions')}</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.city')}</label>
                  <select 
                    value={selectedCity} 
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="select"
                    disabled={!selectedRegion}
                  >
                    <option value="">{t('jobs.allCities')}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.company')}</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('jobs.companyName')}
                    className="input"
                  />
                </div>

                {/* Company Type */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.companyType')}</label>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="select">
                    <option value="">{t('jobs.allTypes')}</option>
                    <option value="Private">Private</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Startup">Startup</option>
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.jobType')}</label>
                  <select 
                    value={jobType} 
                    onChange={(e) => setJobType(e.target.value)}
                    className="select"
                  >
                    <option value="">{t('jobs.allTypes')}</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                {/* Work Mode */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.workMode')}</label>
                  <select 
                    value={workMode} 
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="select"
                  >
                    <option value="">{t('jobs.allModes')}</option>
                    <option value="on-site">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.experience')}</label>
                  <select 
                    value={experienceLevel} 
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="select"
                  >
                    <option value="">{t('jobs.anyExperience')}</option>
                    <option value="junior">Junior (0-2 years)</option>
                    <option value="mid">Mid-level (2-5 years)</option>
                    <option value="senior">Senior (5+ years)</option>
                  </select>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.salaryRange')}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('jobs.min')}
                      className="input py-1.5"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder={t('jobs.max')}
                      className="input py-1.5"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                    />
                  </div>
                </div>

                {/* Deadline within days */}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('jobs.deadlineWithin')}</label>
                  <select value={deadlineWithinDays} onChange={(e) => setDeadlineWithinDays(e.target.value)} className="select">
                    <option value="">{t('jobs.any')}</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t mt-6 flex gap-4">
                <button 
                  onClick={handleResetFilters}
                  className="btn btn-outline flex-1"
                >
                  {t('common.reset')}
                </button>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="btn btn-primary flex-1"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* Top Search and Sort Panel */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder={t('jobs.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowMobileFilters(true)}
                  className="btn btn-outline flex items-center gap-2 lg:hidden"
                >
                  <FiSliders /> {t('common.filter')}
                </button>

                <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value)}
                  className="select w-44"
                >
                  <option value="newest">{t('jobs.newest')}</option>
                  <option value="deadline">{t('jobs.deadline')}</option>
                  <option value="highestSalary">{t('jobs.highestSalary')}</option>
                  <option value="popular">{t('jobs.mostPopular')}</option>
                  <option value="recentlyUpdated">{t('jobs.recentlyUpdated')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card animate-pulse h-40 bg-gray-100 dark:bg-gray-800"></div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="card text-center py-16">
              <FiBriefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('jobs.noJobs')}</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                {t('jobs.noJobsHint')}
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary">
                {t('jobs.clearFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <Link 
                  key={job._id} 
                  to={`/jobs/${job._id}`} 
                  className="card card-hover hover:border-primary-300 dark:hover:border-primary-800 flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h3>
                      {job.isFeatured && (
                        <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {t('jobs.featured')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {job.company?.name}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiMapPin className="text-gray-400" /> 
                        {job.location?.city ? `${job.location.city}, ${job.location.region}` : job.location?.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiBriefcase className="text-gray-400" /> {job.jobType}
                      </span>
                      {job.salary && (job.salary.min || job.salary.max) && (
                        <span className="flex items-center gap-1">
                          <FiDollarSign className="text-gray-400" />
                          {job.salary.min ? `${job.salary.min.toLocaleString()} ` : ''}
                          {job.salary.min && job.salary.max ? '-' : ''}
                          {job.salary.max ? ` ${job.salary.max.toLocaleString()}` : ''} ETB
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="badge badge-primary">{job.category?.name}</span>
                      {job.workMode && (
                        <span className="badge badge-success capitalize">{job.workMode}</span>
                      )}
                      {job.skillsRequired?.slice(0, 3).map((skill) => (
                        <span key={skill._id} className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center md:items-end flex-row md:flex-col justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 gap-2">
                    {job.applicationDeadline && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-semibold mb-2">
                        <FiClock /> Expires {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className="btn btn-primary text-sm py-2">
                      {t('jobs.viewDetails')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default Jobs;
