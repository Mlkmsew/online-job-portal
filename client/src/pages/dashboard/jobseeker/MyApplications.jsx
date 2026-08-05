import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyApplications } from '../../../store/slices/applicationSlice';
import { formatRelativeTime } from '../../../utils/helpers';
import { FiCheckCircle, FiClock, FiFileText, FiCalendar, FiXCircle, FiInfo, FiMapPin } from 'react-icons/fi';

const MyApplications = () => {
  const dispatch = useDispatch();
  const { applications, loading, error } = useSelector((state) => state.applications);
  const [selectedApp, setSelectedApp] = useState(null);
  const safeApplications = Array.isArray(applications) ? applications : [];

  useEffect(() => {
    dispatch(fetchMyApplications());
  }, [dispatch]);

  // Visual status configurations
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Interview Scheduled':
      case 'Interview':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Selected':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Not Selected':
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const steps = [
    { label: 'Submitted', key: 'Submitted', color: 'text-gray-400' },
    { label: 'Reviewed', key: 'Reviewed', color: 'text-blue-500' },
    { label: 'Interview Scheduled', key: 'Interview Scheduled', color: 'text-amber-500' },
    { label: 'Decision', key: 'Decision', color: 'text-green-600' },
  ];

  const getStatusStepIndex = (status) => {
    if (status === 'Submitted') return 0;
    if (status === 'Reviewed') return 1;
    if (status === 'Interview Scheduled' || status === 'Interview') return 2;
    if (status === 'Selected' || status === 'Not Selected') return 3;
    return 0;
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <h1 className="text-3xl font-black mb-8 text-gray-900 dark:text-white">My Applications</h1>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : error ? (
        <div className="card text-center py-16 px-6 border border-dashed border-red-200 bg-white dark:bg-gray-800">
          <FiInfo className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">We could not load your applications</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">{error}</p>
        </div>
      ) : safeApplications.length === 0 ? (
        <div className="card text-center py-16 px-6 border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850">
          <FiFileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">No applications yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            You haven't submitted any job applications. Start exploring active opportunities to launch your career!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {safeApplications.map((app) => {
            const currentStepIdx = getStatusStepIndex(app.status);
            const isRejected = app.status === 'Not Selected';

            return (
              <div
                key={app._id}
                className="card p-6 shadow-sm border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{app.job?.title || 'Job Posting'}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeStyle(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">{app.company?.name || 'Company Name'}</p>
                  <p className="text-xs text-gray-400">Applied {formatRelativeTime(app.appliedAt)}</p>

                  {/* Visual Stepper */}
                  <div className="pt-4 max-w-md hidden sm:block">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isDecisionStep = step.key === 'Decision';
                        
                        let stepBg = 'bg-gray-200 dark:bg-gray-700 text-gray-400';
                        if (isCompleted) {
                          if (isDecisionStep && isRejected) {
                            stepBg = 'bg-red-500 text-white';
                          } else {
                            stepBg = 'bg-teal-500 text-white';
                          }
                        }

                        return (
                          <div key={idx} className="flex flex-col items-center relative z-10">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${stepBg}`}>
                              {isDecisionStep && isRejected && isCompleted ? '✗' : idx + 1}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 mt-1.5">
                              {isDecisionStep && isRejected && isCompleted ? 'Not Selected' : isDecisionStep && isCompleted ? 'Selected' : step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {app.matchScore !== undefined && (
                    <div className="bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-lg text-sm font-black">
                      ⚡ {app.matchScore}% Match
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="btn btn-outline border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-4 py-2 text-sm font-bold flex items-center gap-1.5"
                  >
                    <FiInfo /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-slide-down">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedApp.job?.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedApp.company?.name}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-7 h-7" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Administrative Notes */}
              {selectedApp.employerNote && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-300">
                  <h4 className="font-bold text-sm flex items-center gap-1.5 mb-1">
                    <FiMapPin className="text-amber-500" /> Administrative Notes & Details
                  </h4>
                  <p className="text-sm">{selectedApp.employerNote}</p>
                </div>
              )}

              {/* Status Timeline History */}
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 mb-4">Application History & Timeline</h4>
                {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 ? (
                  <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                    {selectedApp.statusHistory.map((history, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-teal-500 border border-white dark:border-gray-800"></div>
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${getStatusBadgeStyle(history.status)}`}>
                            {history.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(history.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 italic">
                            "{history.note}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-gray-200 dark:border-gray-700 ml-3">
                    <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-teal-500 border border-white dark:border-gray-800"></div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${getStatusBadgeStyle('Submitted')}`}>
                        Submitted
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(selectedApp.appliedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5">
                      Your application has been received by the employer and is awaiting review.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
