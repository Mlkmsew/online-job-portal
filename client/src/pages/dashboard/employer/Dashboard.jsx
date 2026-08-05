import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiCalendar,
  FiSearch,
  FiBell,
  FiMail,
  FiChevronDown,
  FiArrowRight,
  FiMapPin,
  FiClock,
  FiFlag,
  FiUser,
  FiSettings,
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchEmployerDashboard } from '../../../store/slices/employerSlice';
import { logout } from '../../../store/slices/authSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  const parts = [location.city, location.region, location.address].filter(Boolean);
  return parts.join(', ') || '';
};

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { company, jobs, applications, loading } = useSelector((state) => state.employer);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ interviewDate: '', interviewTime: '', interviewLocation: '' });
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [statusById, setStatusById] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployerDashboard());

    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/employer/dashboard');
        if (!mounted) return;
        setInterviews(res.data?.data?.upcomingInterviews || []);
        setNotifications(res.data?.data?.recentNotifications || []);
      } catch (err) {
        // handled by interceptor
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    const initialStatusMap = {};
    applications?.forEach((application) => {
      initialStatusMap[application._id] = application.status;
    });
    setStatusById(initialStatusMap);
  }, [applications]);

  const jobsPosted = jobs?.length || 0;
  const activeJobs = jobs?.filter((job) => job.status === 'active').length || 0;
  const totalApplicants = applications?.length || 0;
  const interviewsCount = interviews?.length || 0;
  const hiredCount = applications?.filter((item) => ['hired', 'Hired', 'Selected', 'Accepted'].includes(item.status)).length || 0;
  const recentApplications = applications?.slice(0, 5) || [];
  const statusOptions = ['Submitted', 'Shortlisted', 'Interview', 'Rejected'];

  const profileCompletion = useMemo(() => {
    if (!company) return 0;
    const fields = [company.name, company.description, company.industry, company.location, company.logo];
    const filled = fields.filter(Boolean).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  }, [company]);

  const chartData = useMemo(() => {
    const newApps = applications?.filter((item) => item.status?.toLowerCase() === 'submitted').length || 0;
    const reviewApps = applications?.filter((item) => ['shortlisted', 'review', 'under review'].includes(item.status?.toLowerCase())).length || 0;
    const interviewApps = applications?.filter((item) => ['interview', 'interview scheduled'].includes(item.status?.toLowerCase())).length || 0;
    const hiredApps = applications?.filter((item) => ['hired', 'selected', 'accepted'].includes(item.status?.toLowerCase())).length || 0;
    return {
      labels: ['New Applications', 'Under Review', 'Interview', 'Hired'],
      datasets: [
        {
          data: [newApps, reviewApps, interviewApps, hiredApps],
          backgroundColor: ['#4ade80', '#a3e635', '#34d399', '#16a34a'],
          hoverBackgroundColor: ['#86efac', '#bef264', '#6ee7b7', '#22c55e'],
          borderWidth: 0,
        },
      ],
    };
  }, [applications]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setStatusById((prev) => ({ ...prev, [applicationId]: status }));
      toast.success('Application status updated');
      dispatch(fetchEmployerDashboard());
    } catch (err) {
      toast.error('Unable to update application status');
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const openInterviewModal = (application) => {
    setSelectedApplication(application);
    setInterviewForm({
      interviewDate: application.interviewDate ? new Date(application.interviewDate).toISOString().split('T')[0] : '',
      interviewTime: application.interviewTime || '',
      interviewLocation: application.interviewLocation || '',
    });
  };

  const handleInterviewSubmit = async (event) => {
    event.preventDefault();
    if (!selectedApplication) return;

    setSubmittingInterview(true);
    try {
      await api.post(`/applications/${selectedApplication._id}/schedule-interview`, interviewForm);
      toast.success('Interview scheduled successfully');
      setSelectedApplication(null);
      setInterviewForm({ interviewDate: '', interviewTime: '', interviewLocation: '' });
      dispatch(fetchEmployerDashboard());
    } catch (err) {
      toast.error('Unable to schedule interview');
    } finally {
      setSubmittingInterview(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-gray-500">Welcome back, {user?.firstName || 'Employer'}!</p>
            <h1 className="text-3xl font-semibold text-gray-900 mt-2">Here's what's happening with your recruitment today.</h1>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, applicants..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-12 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((value) => !value);
                  setShowMessages(false);
                  setShowProfileMenu(false);
                }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition hover:bg-gray-200"
              >
                <FiBell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                  <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
                  <div className="mt-2 max-h-48 space-y-2 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="py-3 text-sm text-gray-500">No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div key={notification._id || notification.id || `${notification.title}-${notification.createdAt}`} className="flex items-start gap-2 rounded-xl border border-gray-100 p-2">
                          <FiBell className="mt-0.5 h-4 w-4 text-emerald-600" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">{notification.title || 'New update'}</div>
                            <div className="text-gray-500">{notification.message || notification.description || 'No details available.'}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 text-right">
                    <Link to="/employer/messages" className="text-sm font-semibold text-emerald-700">View all</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowMessages((value) => !value);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition hover:bg-gray-200"
              >
                <FiMail className="w-5 h-5" />
              </button>

              {showMessages && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                  <h4 className="text-sm font-semibold text-gray-800">Messages</h4>
                  <div className="mt-2 text-sm text-gray-500">Open your inbox to review applicants and team conversations.</div>
                  <div className="mt-3 text-right">
                    <Link to="/employer/messages" className="text-sm font-semibold text-emerald-700">Open Inbox</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu((value) => !value);
                  setShowNotifications(false);
                  setShowMessages(false);
                }}
                className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:shadow-sm"
              >
                <span className="flex h-10 w-10 overflow-hidden rounded-full bg-emerald-100 text-emerald-700">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.firstName || 'Profile'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'E'}
                    </span>
                  )}
                </span>
                <span>{user?.firstName || 'Employer'}</span>
                <FiChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/employer/company');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiUser className="h-4 w-4" /> Company profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/employer/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiSettings className="h-4 w-4" /> Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <FiArrowRight className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Jobs Posted', value: jobsPosted, icon: FiBriefcase, accent: 'bg-emerald-100 text-emerald-600', status: `${activeJobs} active` },
          { label: 'Total Applicants', value: totalApplicants, icon: FiUsers, accent: 'bg-sky-100 text-sky-600', status: 'New this week' },
          { label: 'Active Jobs', value: activeJobs, icon: FiFlag, accent: 'bg-violet-100 text-violet-600', status: `${activeJobs} live roles` },
          { label: 'Upcoming Interviews', value: interviewsCount, icon: FiCalendar, accent: 'bg-amber-100 text-amber-600', status: `${interviewsCount} scheduled` },
          { label: 'Hired Candidates', value: hiredCount, icon: FiCheckCircle, accent: 'bg-emerald-200 text-emerald-700', status: `${hiredCount} filled` },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-3xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">{card.status}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl bg-emerald-600 p-6 text-white shadow-sm transition-all duration-300 hover:shadow-lg">
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Company profile</p>
            <h2 className="mt-3 text-2xl font-semibold">Complete your company profile to attract more applicants.</h2>
            <p className="mt-3 max-w-2xl text-sm text-emerald-100">Add your company logo, description, industry, and location.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link to="/employer/company" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Complete Profile
            </Link>
            <Link to="/employer/post-job" className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              Post New Job
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                <span className="text-3xl font-bold">{company?.name?.charAt(0) || 'C'}</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{company?.name || 'Company Name'}</h3>
                <p className="text-sm text-gray-500">{company?.industry || 'Industry not set'}</p>
              </div>
            </div>
            <Link to="/employer/company" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
              Edit Profile
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Location</p>
              <p className="mt-2 text-base font-medium text-gray-900">{formatLocation(company?.location) || 'Not available'}</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Company Size</p>
              <p className="mt-2 text-base font-medium text-gray-900">{company?.size || company?.companySize || 'Not available'}</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="mt-2 text-base font-medium text-gray-900">{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'Not available'}</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Profile Completion</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">{profileCompletion}% complete</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Analytics</p>
              <h3 className="text-xl font-semibold text-gray-900">Applicant funnel</h3>
            </div>
            <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-600">Live data</div>
          </div>
          <div className="h-72">
            <Doughnut data={chartData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 20, boxWidth: 12 } } } }} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {chartData.labels.map((label, index) => (
              <div key={label} className="flex items-center gap-3 rounded-3xl bg-gray-50 p-4">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }} />
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{chartData.datasets[0].data[index]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Recent Applicants</p>
              <h3 className="text-xl font-semibold text-gray-900">Latest candidates</h3>
            </div>
            <Link to="/employer/jobs" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all jobs</Link>
          </div>
          <div className="mt-6 space-y-4">
            {recentApplications.length ? (
              recentApplications.map((application) => (
                <div key={application._id} className="flex flex-col gap-4 rounded-3xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                      {application.applicant?.avatar ? (
                        <img src={application.applicant.avatar} alt={application.applicant?.firstName || 'Applicant'} className="h-12 w-12 rounded-3xl object-cover" />
                      ) : (
                        <span className="text-lg font-semibold">{(application.applicant?.firstName || 'A').charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{application.applicant?.firstName} {application.applicant?.lastName}</p>
                      <p className="text-sm text-gray-500">{application.job?.title || 'Applied position'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
                      <FiClock className="h-4 w-4" />
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/employer/applicants/${application.job?._id}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      View <FiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No recent applicants yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <h3 className="text-xl font-semibold text-gray-900">Current openings</h3>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{activeJobs} live</div>
            </div>
            <div className="mt-6 space-y-4">
              {jobs.filter((job) => job.status === 'active').slice(0, 4).map((job) => (
                <div key={job._id} className="rounded-3xl border border-gray-200 p-4 hover:border-emerald-200 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.employmentType || job.type || job.jobType || 'Full time'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FiMapPin className="h-4 w-4" />
                      <span>{formatLocation(job.location) || 'Remote'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                    <span>{job.applicantsCount || 0} applicants</span>
                    <span>Closes {job.closingDate ? new Date(job.closingDate).toLocaleDateString() : 'TBD'}</span>
                    <Link to={`/employer/applicants/${job._id}`} className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                      View <FiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
              {jobs.filter((job) => job.status === 'active').length === 0 && (
                <p className="text-gray-600">No active jobs available right now.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Notifications</p>
                <h3 className="text-xl font-semibold text-gray-900">Recent updates</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {notifications.length ? (
                notifications.slice(0, 4).map((notification) => (
                  <div key={notification._id} className="rounded-3xl border border-gray-200 p-4 bg-gray-50 transition hover:border-emerald-200">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{notification.title || (notification.message || 'Notification')}</p>
                        <p className="text-sm text-gray-500">{notification.subtitle || 'Action recommended'}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">New</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No recent notifications.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Schedule Interview</h3>
                <p className="text-sm text-gray-500">Confirm the interview time for this candidate.</p>
              </div>
              <button onClick={() => setSelectedApplication(null)} className="text-gray-500 transition hover:text-gray-700">Close</button>
            </div>
            <form onSubmit={handleInterviewSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interview Date</label>
                  <input
                    type="date"
                    value={interviewForm.interviewDate}
                    onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewDate: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interview Time</label>
                  <input
                    type="time"
                    value={interviewForm.interviewTime}
                    onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location / Online Link</label>
                <input
                  type="text"
                  value={interviewForm.interviewLocation}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewLocation: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="Conference room A or meeting link"
                  required
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setSelectedApplication(null)} className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700" disabled={submittingInterview}>
                  {submittingInterview ? 'Saving...' : 'Save Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading employer dashboard...</p>}
    </div>
  );
};

export default EmployerDashboard;
