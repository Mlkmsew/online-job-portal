import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import {
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiSearch,
  FiSliders,
  FiDollarSign,
  FiX,
  FiBookmark,
} from 'react-icons/fi';
import { REGIONS, REGION_CITIES } from '../constants/locations';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead'];
const EDUCATION_LEVELS = ['No Requirement', 'High School', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Professional Certificate'];
const DATE_POSTED_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '1', label: 'Today' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

const Jobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [savedJobMap, setSavedJobMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [datePosted, setDatePosted] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [pages, setPages] = useState(0);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const limit = 12;

  const skillOptions = useMemo(
    () => skills.map((skill) => ({ value: skill._id, label: skill.name })),
    [skills]
  );

  const selectedSkillOptions = useMemo(
    () => skillOptions.filter((option) => selectedSkills.includes(option.value)),
    [selectedSkills, skillOptions]
  );

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
    setEducationLevel(params.get('education') || '');
    setDatePosted(params.get('postedWithinDays') || '');
    setMinSalary(params.get('minSalary') || '');
    setMaxSalary(params.get('maxSalary') || '');
    setSelectedSkills(params.get('skills') ? params.get('skills').split(',').filter(Boolean) : []);
    setSort(params.get('sort') || 'relevance');
    setPage(parseInt(params.get('page') || '1', 10));
  }, [location.search]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    const loadSkills = async () => {
      try {
        const res = await api.get('/skills');
        setSkills(res.data?.data || []);
      } catch (error) {
        console.error('Failed to load skills:', error);
      }
    };

    loadCategories();
    loadSkills();
  }, []);

  useEffect(() => {
    // no-op placeholder for future enhancements
  }, []);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!isAuthenticated) {
        setSavedJobMap({});
        return;
      }
      try {
        const res = await api.get('/bookmarks', { params: { limit: 200 } });
        const bookmarks = res.data?.data || [];
        const map = {};
        bookmarks.forEach((bookmark) => {
          if (bookmark.job?._id) map[bookmark.job._id] = bookmark._id;
        });
        setSavedJobMap(map);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    };

    loadBookmarks();
  }, [isAuthenticated]);

  const userSkills = useMemo(() => {
    const rawSkills = [
      ...(Array.isArray(user?.skills) ? user.skills : []),
      ...(Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : []),
    ];
    return Array.from(
      new Set(
        rawSkills
          .map((skill) => (typeof skill === 'string' ? skill.trim().toLowerCase() : skill?.name?.trim().toLowerCase() || ''))
          .filter(Boolean)
      )
    );
  }, [user]);

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
    education: educationLevel,
    postedWithinDays: datePosted,
    minSalary,
    maxSalary,
    skills: selectedSkills.join(','),
    sort,
    page,
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedRegion('');
    setSelectedCity('');
    setJobType('');
    setWorkMode('');
    setExperienceLevel('');
    setCompanyName('');
    setCompanyType('');
    setEducationLevel('');
    setDatePosted('');
    setMinSalary('');
    setMaxSalary('');
    setSelectedSkills([]);
    setSort('relevance');
    setPage(1);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedRegion) params.set('region', selectedRegion);
    if (selectedCity) params.set('city', selectedCity);
    if (jobType) params.set('jobType', jobType);
    if (workMode) params.set('workMode', workMode);
    if (experienceLevel) params.set('experience', experienceLevel);
    if (companyName) params.set('companyName', companyName);
    if (companyType) params.set('companyType', companyType);
    if (educationLevel) params.set('education', educationLevel);
    if (datePosted) params.set('postedWithinDays', datePosted);
    if (minSalary) params.set('minSalary', minSalary);
    if (maxSalary) params.set('maxSalary', maxSalary);
    if (selectedSkills.length) params.set('skills', selectedSkills.join(','));
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());

    const nextSearch = params.toString();
    if (nextSearch !== location.search.replace(/^[?]/, '')) {
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [
    search,
    selectedCategory,
    selectedRegion,
    selectedCity,
    jobType,
    workMode,
    experienceLevel,
    companyName,
    companyType,
    educationLevel,
    datePosted,
    minSalary,
    maxSalary,
    selectedSkills,
    sort,
    page,
    location.pathname,
    location.search,
    navigate,
  ]);

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
    setEducationLevel(q.education || '');
    setDatePosted(q.postedWithinDays || '');
    setMinSalary(q.minSalary || '');
    setMaxSalary(q.maxSalary || '');
    setSelectedSkills((q.skills || '').split(',').filter(Boolean));
    setSort(q.sort || 'relevance');
    setPage(q.page ? parseInt(q.page, 10) : 1);
    toast.success(`Applied saved search: ${savedSearch.name}`);
  };


  const calculateMatchScore = (job) => {
    if (!Array.isArray(userSkills) || userSkills.length === 0) return null;
    if (!Array.isArray(job.skillsRequired) || job.skillsRequired.length === 0) return null;

    const requiredSkillNames = job.skillsRequired
      .map((skill) => (skill?.name || '').trim().toLowerCase())
      .filter(Boolean);

    if (!requiredSkillNames.length) return null;

    const matchedSkills = requiredSkillNames.filter((skill) => userSkills.includes(skill));
    return Math.round((matchedSkills.length / requiredSkillNames.length) * 100);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
        const params = { page, limit };
      if (sort && sort !== 'relevance') params.sort = sort;
      if (search) params.search = search;
      if (companyName) params.companyName = companyName;
      if (companyType) params.companyType = companyType;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedRegion) params.region = selectedRegion;
      if (selectedCity) params.city = selectedCity;
      if (jobType) params.jobType = jobType;
      if (workMode) params.workMode = workMode;
      if (experienceLevel) params.experience = experienceLevel;
      if (educationLevel) params.education = educationLevel;
      if (datePosted) params.postedWithinDays = datePosted;
      if (minSalary) params.minSalary = minSalary;
      if (maxSalary) params.maxSalary = maxSalary;
      if (selectedSkills.length) params.skills = selectedSkills.join(',');

      const res = await api.get('/jobs', { params });
      const payload = res.data;
      const normalizedJobs = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setJobs(normalizedJobs);
      setTotalJobs(payload.pagination?.total ?? payload.count ?? normalizedJobs.length);
      setPages(payload.pagination?.pages ?? 0);
      setHasPrevPage(!!payload.pagination?.hasPrev);
      setHasNextPage(!!payload.pagination?.hasNext);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    search,
    selectedCategory,
    selectedRegion,
    selectedCity,
    jobType,
    workMode,
    experienceLevel,
    educationLevel,
    datePosted,
    minSalary,
    maxSalary,
    selectedSkills,
    sort,
    page,
    companyName,
    companyType,
  ]);

  const handleToggleBookmark = async (job) => {
    if (!isAuthenticated) {
      toast.error('Please login to save jobs.');
      navigate('/login');
      return;
    }

    const existingBookmarkId = savedJobMap[job._id];
    try {
      if (existingBookmarkId) {
        await api.delete(`/bookmarks/${existingBookmarkId}`);
        setSavedJobMap((prev) => {
          const next = { ...prev };
          delete next[job._id];
          return next;
        });
        toast.success('Removed saved job.');
      } else {
        const res = await api.post('/bookmarks', { job: job._id });
        const bookmarkId = res.data?.data?._id;
        if (bookmarkId) {
          setSavedJobMap((prev) => ({ ...prev, [job._id]: bookmarkId }));
        }
        toast.success('Job saved successfully.');
      }
    } catch (error) {
      console.error('Failed to update saved job:', error);
    }
  };

  const availableCities = selectedRegion ? REGION_CITIES[selectedRegion] || [] : [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Find Jobs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Explore job opportunities and apply to roles that fit your profile.</p>
          </div>
        </div>

        <div className="grid gap-6">
          <main className="space-y-6">
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {/* Essentials row: Search, Category, Job Type */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search jobs, companies or skills"
                    className="input pl-11"
                  />
                </div>
                <div>
                  <label className="sr-only">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="select"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="sr-only">Job type</label>
                  <select
                    value={jobType}
                    onChange={(e) => { setJobType(e.target.value); setPage(1); }}
                    className="select"
                  >
                    <option value="">All Job Types</option>
                    {JOB_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compact second row: Work mode + Region/City */}
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="sr-only">Work mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => { setWorkMode(e.target.value); setPage(1); }}
                    className="select w-full"
                  >
                    <option value="">Any mode</option>
                    <option value="on-site">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="sr-only">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(''); setPage(1); }}
                    className="select w-full"
                  >
                    <option value="">All regions</option>
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="sr-only">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
                    className="select w-full"
                  >
                    <option value="">All cities</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced filters toggle & total */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((s) => !s)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700"
                >
                  <FiSliders className="h-4 w-4 text-gray-500" />
                  {showAdvanced ? 'Hide advanced filters' : 'More filters'}
                </button>
                <div className="text-sm text-gray-500">{totalJobs.toLocaleString()} jobs found</div>
              </div>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Company</label>
                      <input
                        value={companyName}
                        onChange={(e) => { setCompanyName(e.target.value); setPage(1); }}
                        className="input w-full"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Company type</label>
                      <select
                        value={companyType}
                        onChange={(e) => { setCompanyType(e.target.value); setPage(1); }}
                        className="select w-full"
                      >
                        <option value="">All company types</option>
                        <option value="Private">Private</option>
                        <option value="Government">Government</option>
                        <option value="NGO">NGO</option>
                        <option value="Startup">Startup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Sort by</label>
                      <select
                        value={sort}
                        onChange={(e) => { setSort(e.target.value); setPage(1); }}
                        className="select w-full"
                      >
                        <option value="relevance">Sort by relevance</option>
                        <option value="newest">Newest first</option>
                        <option value="salaryHighToLow">Salary high to low</option>
                        <option value="salaryLowToHigh">Salary low to high</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Education</label>
                      <select
                        value={educationLevel}
                        onChange={(e) => { setEducationLevel(e.target.value); setPage(1); }}
                        className="select w-full"
                      >
                        <option value="">Any education level</option>
                        {EDUCATION_LEVELS.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Experience</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => { setExperienceLevel(e.target.value); setPage(1); }}
                        className="select w-full"
                      >
                        <option value="">Any experience level</option>
                        {EXPERIENCE_LEVELS.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Date posted</label>
                      <select
                        value={datePosted}
                        onChange={(e) => { setDatePosted(e.target.value); setPage(1); }}
                        className="select w-full"
                      >
                        {DATE_POSTED_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Min salary</label>
                        <input
                          type="number"
                          value={minSalary}
                          onChange={(e) => { setMinSalary(e.target.value); setPage(1); }}
                          className="input w-full"
                          placeholder="ETB"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Max salary</label>
                        <input
                          type="number"
                          value={maxSalary}
                          onChange={(e) => { setMaxSalary(e.target.value); setPage(1); }}
                          className="input w-full"
                          placeholder="ETB"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Skills</label>
                    <Select
                      value={selectedSkillOptions}
                      onChange={(selected) => { setSelectedSkills((selected || []).map((item) => item.value)); setPage(1); }}
                      options={skillOptions}
                      isMulti
                      placeholder="Select skills"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>
              )}

              {/* Bottom actions: Clear + Apply, aligned to the right */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={resetFilters}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    fetchJobs();
                  }}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Apply filters
                </button>
              </div>
            </div>


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
                {jobs.map((job) => {
                  const matchScore = calculateMatchScore(job);
                  return (
                    <div key={job._id} className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-600">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-4 lg:max-w-[65%]">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                              {job.company?.logo ? (
                                <img src={job.company.logo} alt={job.company.name} className="h-10 w-10 rounded-2xl object-cover" />
                              ) : (
                                <span className="text-xl font-bold text-emerald-600">{job.company?.name?.charAt(0) || 'C'}</span>
                              )}
                            </div>
                            <div>
                              <Link to={`/jobs/${job._id}`} className="text-xl font-bold text-gray-900 dark:text-white hover:text-emerald-600 transition">
                                {job.title}
                              </Link>
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{job.company?.name || 'Company'}</p>
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              <FiMapPin className="h-4 w-4" />
                              {job.location?.city ? `${job.location.city}, ${job.location.region}` : job.location?.region || 'Remote'}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              <FiBriefcase className="h-4 w-4" />
                              {job.jobType}
                            </span>
                            {job.experienceLevel && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                <FiClock className="h-4 w-4" />
                                {job.experienceLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                            {job.description?.length > 180 ? `${job.description.slice(0, 180)}...` : job.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(job.skills?.technical) && job.skills.technical.length > 0
                              ? job.skills.technical.slice(0, 5)
                              : Array.isArray(job.skillsRequired)
                                ? job.skillsRequired.slice(0, 5).map((skill) => skill.name)
                                : []
                            ).map((skill, skillIndex) => (
                              <span key={`${skill}-${skillIndex}`} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {skill}
                              </span>
                            ))}
                            {Array.isArray(job.benefits) && job.benefits.slice(0, 3).map((benefit) => (
                              <span key={benefit} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-4 lg:w-[280px]">
                          <div className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-950">
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <span>Posted</span>
                              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                              <span>Salary</span>
                              <span>
                                {job.salary?.min && job.salary?.max
                                  ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ETB`
                                  : 'Negotiable'}
                              </span>
                            </div>
                          </div>

                          {matchScore !== null && (
                            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
                              AI Match: {matchScore}%
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(job)}
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${savedJobMap[job._id] ? 'bg-emerald-700 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200'}`}
                          >
                            <FiBookmark className="h-4 w-4" />
                            {savedJobMap[job._id] ? 'Saved' : 'Save Job'}
                          </button>
                          <Link
                            to={`/jobs/${job._id}`}
                            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Apply Now
                          </Link>
                          <Link
                            to={`/jobs/${job._id}`}
                            className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {pages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-3 rounded-[32px] border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <button
                      type="button"
                      disabled={!hasPrevPage}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-950"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${pageNumber === page ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-300'}`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={!hasNextPage}
                      onClick={() => setPage((current) => Math.min(pages, current + 1))}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-950"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
