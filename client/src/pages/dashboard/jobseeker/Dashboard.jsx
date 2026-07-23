import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { FiFileText, FiBookmark, FiBriefcase, FiArrowRight, FiZap, FiAward, FiClock, FiMapPin } from 'react-icons/fi';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [entryJobs, setEntryJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, appsRes, bookmarksRes, jobsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/applications/my'),
          api.get('/bookmarks'),
          api.get('/jobs', { params: { experienceLevel: 'Entry Level', limit: 3 } }),
        ]);

        const dashboardData = dashboardRes.data?.data || {};
        setRecommendedJobs(dashboardData.recommendedJobs || []);
        setApplications(appsRes.data?.data || appsRes.data || []);
        setBookmarks(bookmarksRes.data?.data || bookmarksRes.data || []);
        setEntryJobs(jobsRes.data?.data || jobsRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Sub-counter breakdown calculations
  const activeAppsCount = applications.filter((app) => ['Submitted', 'Reviewed'].includes(app.status) || app.status === 'pending').length;
  const interviewsCount = applications.filter((app) => app.status === 'Interview Scheduled' || app.status === 'interview').length;
  const archivedCount = applications.filter((app) => ['Selected', 'Not Selected', 'accepted', 'rejected'].includes(app.status)).length;

  const profileCompleteness = user?.profileCompleteness || 55;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here is a summary of your career search progress today.</p>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center justify-between shadow-sm border border-gray-150 bg-white dark:bg-gray-800">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Total Applications</p>
            <p className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{applications.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center text-teal-650 shrink-0">
            <FiFileText className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between shadow-sm border border-gray-150 bg-white dark:bg-gray-800">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Saved Postings</p>
            <p className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{bookmarks.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-650 shrink-0">
            <FiBookmark className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between shadow-sm border border-gray-150 bg-white dark:bg-gray-800">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Profile Views</p>
            <p className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{user?.profileViews || 14}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-650 shrink-0">
            <FiBriefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Block 1: Application Breakdown Grid */}
      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Application Progress Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex flex-col justify-between">
            <span className="text-xs text-gray-500 font-bold uppercase">Active Applications</span>
            <span className="text-2xl font-black mt-2 text-teal-600">{activeAppsCount}</span>
            <p className="text-[10px] text-gray-400 mt-1">Pending review or current status updates</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex flex-col justify-between">
            <span className="text-xs text-gray-500 font-bold uppercase">Interviews Scheduled</span>
            <span className="text-2xl font-black mt-2 text-amber-500">{interviewsCount}</span>
            <p className="text-[10px] text-gray-400 mt-1">Direct interview calls in pipeline</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex flex-col justify-between">
            <span className="text-xs text-gray-500 font-bold uppercase">Archived Decisions</span>
            <span className="text-2xl font-black mt-2 text-indigo-500">{archivedCount}</span>
            <p className="text-[10px] text-gray-400 mt-1">Accepted selection and other decisions</p>
          </div>
        </div>
      </div>

      {/* Block 2: Built-in CV Guidance Banner */}
      {(!user?.cv || profileCompleteness < 80) && (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
          <div className="max-w-xl relative z-10">
            <span className="bg-white/20 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
              Fresh Graduate Tool
            </span>
            <p className="font-bold text-lg mt-2 leading-relaxed">
              Don't have a professional CV? Use our built-in interactive CV builder to generate a beautiful, downloadable PDF resume instantly!
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/80">
              <span>Profile Completeness:</span>
              <span className="font-black text-white">{profileCompleteness}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/resume')}
            className="bg-white text-teal-700 hover:bg-teal-50 transition-all font-extrabold py-3 px-6 rounded-xl text-center text-sm shrink-0 self-start sm:self-center shadow-lg flex items-center gap-1.5"
          >
            Create Resume Now <FiArrowRight />
          </button>
          <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-white/5 rounded-full blur-xl"></div>
        </div>
      )}

      {/* Block: Recommended Jobs */}
      <div className="card p-6 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recommended Jobs</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Jobs matched to your resume skills with a calculated fit score.</p>
          </div>
          <span className="text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold">Smart Match</span>
        </div>

        {recommendedJobs.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Upload your resume to receive personalized job recommendations.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendedJobs.map((job) => (
              <div key={job._id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:border-teal-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{job.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{job.company?.name || 'Company'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-teal-50 text-teal-700">{job.matchPercentage}% Match</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{job.jobType}</span>
                  <span>{job.skillsRequired?.length || 0} skills</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{job.location?.city || job.location?.region || 'Remote/Unknown'}</span>
                  <Link to={`/jobs/${job._id}`} className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">View Job</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block 3: Curated Fresh Graduate Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Entry-Level Opportunities</h3>
            <p className="text-xs text-gray-450 dark:text-gray-400 font-medium">No experience required. Handpicked jobs for fresh graduates.</p>
          </div>
          <Link to="/jobs?experienceLevel=Entry Level" className="text-teal-600 dark:text-teal-400 text-sm font-bold flex items-center gap-1 hover:underline">
            View All <FiArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {entryJobs.length > 0 ? (
            entryJobs.map((job) => (
              <div key={job._id} className="card p-5 border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col justify-between hover:border-teal-200 transition-all duration-200">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-teal-600 transition">
                    <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                  </h4>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">{job.company?.name || 'Company'}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-450 dark:text-gray-400 mt-4 mb-4">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="text-gray-450 shrink-0" />
                      {job.location?.city || job.location?.region}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiBriefcase className="text-gray-450 shrink-0" />
                      {job.jobType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700 mt-2 text-xs">
                  <span className="bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-bold">
                    0 Experience
                  </span>
                  <Link to={`/jobs/${job._id}`} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                    Apply Now
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full card py-10 text-center border-dashed border border-gray-250 dark:border-gray-700 bg-gray-50/50">
              <p className="text-sm text-gray-500">No entry-level listings active currently. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
