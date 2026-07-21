import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiBriefcase, FiUsers, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { fetchEmployerDashboard } from '../../../store/slices/employerSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const dispatch = useDispatch();
  const { company, jobs, applications, loading } = useSelector((state) => state.employer);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ interviewDate: '', interviewTime: '', interviewLocation: '' });
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [statusById, setStatusById] = useState({});

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
  const totalApplicants = applications?.length || 0;
  const hiredCount = applications?.filter((item) => item.status === 'hired' || item.status === 'Hired' || item.status === 'Selected').length || 0;
  const recentApplications = applications?.slice(0, 3) || [];
  const statusOptions = ['Submitted', 'Shortlisted', 'Interview', 'Rejected'];

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
    <div>
      <h1 className="text-3xl font-bold mb-8">Employer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Jobs Posted</p>
              <p className="text-3xl font-bold">{jobsPosted}</p>
            </div>
            <FiBriefcase className="w-12 h-12 text-primary-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Applicants</p>
              <p className="text-3xl font-bold">{totalApplicants}</p>
            </div>
            <FiUsers className="w-12 h-12 text-secondary-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Hired</p>
              <p className="text-3xl font-bold">{hiredCount}</p>
            </div>
            <FiCheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Company Overview</h2>
          {company ? (
            <div className="space-y-3">
              <p className="text-gray-600">Name: <span className="font-medium text-gray-900">{company.name}</span></p>
              <p className="text-gray-600">Industry: <span className="font-medium text-gray-900">{company.industry || 'Not set'}</span></p>
              <p className="text-gray-600">Status: <span className="font-medium text-gray-900">{company.isApproved ? 'Approved' : 'Pending Approval'}</span></p>
              <p className="text-gray-600">Jobs Posted: <span className="font-medium text-gray-900">{jobsPosted}</span></p>
              <p className="text-gray-600">Profile Views: <span className="font-medium text-gray-900">{company.profileViews || 0}</span></p>
            </div>
          ) : (
            <p className="text-gray-600">No company profile found. Create your company first to post jobs.</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
          {recentApplications.length > 0 ? (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application._id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-semibold">{application.applicant?.firstName} {application.applicant?.lastName}</p>
                    <p className="text-sm text-gray-500">Role: {application.job?.title}</p>
                    <p className="text-sm text-gray-500">Status: {application.status}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={statusById[application._id] || application.status || 'Submitted'}
                      onChange={(event) => handleStatusChange(application._id, event.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => openInterviewModal(application)}
                      className="btn btn-outline btn-sm inline-flex items-center gap-2"
                    >
                      <FiCalendar /> Schedule Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No applications yet. Applicants will appear here after they apply.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upcoming Interviews</h2>
          {interviews.length ? (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div key={interview._id} className="p-3 border rounded">
                  <p className="font-medium">{interview.job?.title || 'Interview'}</p>
                  <p className="text-sm text-gray-600">
                    {interview.applicant ? `${interview.applicant.firstName || ''} ${interview.applicant.lastName || ''}`.trim() : 'Applicant'}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(interview.scheduledDate).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{interview.location || interview.meetingLink || 'Location details to be shared.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No upcoming interviews scheduled.</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
          {notifications.length ? (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n._id} className="p-3 border rounded">
                  <p className="font-medium">{n.title || n.message}</p>
                  <p className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No notifications yet.</p>
          )}
        </div>
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Schedule Interview</h3>
            <form onSubmit={handleInterviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Interview Date</label>
                <input
                  type="date"
                  value={interviewForm.interviewDate}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewDate: event.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interview Time</label>
                <input
                  type="time"
                  value={interviewForm.interviewTime}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewTime: event.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location / Online Link</label>
                <input
                  type="text"
                  value={interviewForm.interviewLocation}
                  onChange={(event) => setInterviewForm((prev) => ({ ...prev, interviewLocation: event.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Conference room A or https://meet.example.com"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedApplication(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingInterview}>
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
