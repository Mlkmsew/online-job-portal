import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchEmployerApplications } from '../../../store/slices/employerSlice';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const ViewApplicants = () => {
  const { jobId } = useParams();
  const dispatch = useDispatch();
  const { applications, loading } = useSelector((state) => state.employer);
  const [statusById, setStatusById] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ interviewDate: '', interviewTime: '', interviewLocation: '' });
  const [submittingInterview, setSubmittingInterview] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployerApplications({ job: jobId }));
  }, [dispatch, jobId]);

  useEffect(() => {
    const initialStatusMap = {};
    applications?.forEach((application) => {
      initialStatusMap[application._id] = application.status;
    });
    setStatusById(initialStatusMap);
  }, [applications]);

  const statusOptions = ['Submitted', 'Shortlisted', 'Interview', 'Rejected'];

  const handleStatusChange = async (applicationId, status) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setStatusById((prev) => ({ ...prev, [applicationId]: status }));
      toast.success('Application status updated');
      dispatch(fetchEmployerApplications({ job: jobId }));
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
      dispatch(fetchEmployerApplications({ job: jobId }));
    } catch (err) {
      toast.error('Unable to schedule interview');
    } finally {
      setSubmittingInterview(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-3xl font-bold">Applicant List</h1>
        <p className="text-gray-600 mt-2">Review candidates for your posted roles and schedule interviews.</p>
        <div className="mt-4">
          <button
            onClick={() => window.open(`${api.defaults.baseURL}/applications/employer/export?job=${jobId || ''}`, '_blank')}
            className="btn btn-outline btn-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading applicants...</p>}

      <div className="grid gap-4">
        {applications.length > 0 ? (
          applications.map((application) => (
            <div key={application._id} className="card">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{application.applicant?.firstName} {application.applicant?.lastName}</h2>
                    <p className="text-gray-500">Applied for {application.job?.title}</p>
                    {application.applicant?.headline && (
                      <p className="text-sm font-medium text-primary-600 mt-0.5">{application.applicant.headline}</p>
                    )}
                    {application.applicant?.skills && application.applicant.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {application.applicant.skills.slice(0, 8).map((skill) => (
                          <span key={skill._id || skill} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                            {skill.name || skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {application.matchScore !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        application.matchScore >= 80
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : application.matchScore >= 50
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        ⚡ {application.matchScore}% Match
                      </div>
                    )}
                    <span className="badge badge-primary">{application.status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Submitted on {new Date(application.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">{application.coverLetter || 'No cover letter provided.'}</p>
                {application.interviewDate && (
                  <p className="text-sm text-gray-600">
                    Interview scheduled for {new Date(application.interviewDate).toLocaleString()} at {application.interviewLocation || 'TBD'}
                  </p>
                )}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap">
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
                    className="btn btn-primary btn-sm"
                  >
                    Schedule Interview
                  </button>
                  <button
                    onClick={() => {
                      window.open(`${api.defaults.baseURL}/applications/${application._id}/resume`, '_blank');
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    View / Download Resume
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/applications/${application._id}/shortlist`);
                        toast.success('Applicant shortlisted');
                        dispatch(fetchEmployerApplications({ job: jobId }));
                      } catch (err) {
                        toast.error('Unable to shortlist applicant');
                      }
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/applications/${application._id}/hire`);
                        toast.success('Applicant hired/accepted');
                        dispatch(fetchEmployerApplications({ job: jobId }));
                      } catch (err) {
                        toast.error('Unable to update hire status');
                      }
                    }}
                    className="btn btn-success btn-sm"
                  >
                    Hire
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/applications/${application._id}/reject`);
                        toast('Applicant rejected', { icon: '⚠️' });
                        dispatch(fetchEmployerApplications({ job: jobId }));
                      } catch (err) {
                        toast.error('Unable to reject applicant');
                      }
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <p className="text-gray-600">No applicants found for this job yet.</p>
          </div>
        )}
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
    </div>
  );
};

export default ViewApplicants;
