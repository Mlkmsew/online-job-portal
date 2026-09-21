import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import systemSettingsService from '../../../services/systemSettingsService';
import { FiEdit2, FiTrash2, FiEye, FiUsers, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageJobs = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingJobId, setPayingJobId] = useState(null);
  const [feeSettings, setFeeSettings] = useState({
    enabled: false,
    amount: 0,
    currency: 'ETB',
  });
  const [feeLoading, setFeeLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ open: false, job: null });
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('chapa');

  useEffect(() => {
    fetchJobs();
    loadFeeSettings();
  }, []);

  const loadFeeSettings = async () => {
    try {
      const res = await systemSettingsService.getJobPostingFeeSettings();
      if (res.data?.success && res.data?.data) {
        setFeeSettings(res.data.data.jobPostingFee);
      }
    } catch (err) {
      console.error('Failed to load fee settings:', err);
    } finally {
      setFeeLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/my/posted');
      const jobsList = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setJobs(jobsList);
    } catch (error) {
      toast.error(t('employer.manageJobs.loadFailed') || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('employer.manageJobs.confirmDelete') || 'Are you sure you want to delete this job?')) return;

    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter((j) => j._id !== id));
      toast.success(t('employer.manageJobs.deletedSuccess') || 'Job deleted successfully');
    } catch (error) {
      toast.error(t('employer.manageJobs.deleteFailed') || 'Failed to delete job');
    }
  };

  const openPaymentModal = (job) => {
    setPaymentRef('');
    setPaymentMethod('chapa');
    setPaymentModal({ open: true, job });
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false, job: null });
    setPaymentRef('');
  };

  const handlePaymentSubmit = async () => {
    if (!paymentRef.trim()) {
      toast.error(t('employer.manageJobs.paymentRefRequired') || 'Payment reference is required.');
      return;
    }

    const job = paymentModal.job;
    if (!job) return;

    setPayingJobId(job._id);
    try {
      const res = await systemSettingsService.markJobAsPaid(job._id, {
        paymentReference: paymentRef.trim(),
        paymentMethod,
      });
      if (res.data?.success) {
        toast.success(t('employer.manageJobs.paymentSuccess') || 'Payment confirmed. Job is now published.');
        setJobs(jobs.map((j) => (j._id === job._id ? { ...j, status: 'published', publishedAt: new Date().toISOString() } : j)));
        closePaymentModal();
      } else {
        toast.error(res.data?.message || t('employer.manageJobs.paymentFailed') || 'Payment failed. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('employer.manageJobs.paymentError') || 'An error occurred during payment.');
    } finally {
      setPayingJobId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('sidebar.manageJobs')}</h1>
        <Link to="/employer/post-job" className="btn btn-primary">{t('sidebar.postJob')}</Link>
      </div>

      {loading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">{t('employer.manageJobs.noJobs') || 'No jobs posted yet.'}</p>
          <Link to="/employer/post-job" className="btn btn-primary">{t('sidebar.postJob')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isPaymentPending = job.status === 'payment_pending';
            const isPublished = job.status === 'published' || job.isApproved;
            // Payment is considered verified if job has paymentReference (set during job creation after payment verification)
            const isPaymentVerified = !!job.paymentReference;

            return (
              <div key={job._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                    <p className="text-gray-600 mb-2">{job.location?.region}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`badge ${
                        isPublished
                          ? 'badge-success'
                          : isPaymentPending
                          ? isPaymentVerified
                            ? 'badge-info'
                            : 'badge-warning'
                          : job.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}>
                        {isPublished
                          ? (t('employer.manageJobs.published') || 'Published')
                          : isPaymentPending
                          ? isPaymentVerified
                            ? (t('employer.manageJobs.awaitingApproval') || 'Awaiting Approval')
                            : (t('employer.manageJobs.paymentPending') || 'Payment Pending')
                          : job.status === 'pending'
                          ? (t('dashboard.status.underReview') || 'Pending Review')
                          : job.status}
                      </span>
                      <span>{job.applicantsCount || 0} {t('sidebar.applicants')}</span>
                      {job.genderPreference && job.genderPreference !== 'any' && (
                        <span className="text-gray-600">
                          {t('employer.manageJobs.genderRequirement')} {t(`employer.postJob.genderOptions.${job.genderPreference}`)}
                        </span>
                      )}
                    </div>
                    {isPaymentPending && !isPaymentVerified && feeSettings.enabled && !feeLoading && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              {t('employer.manageJobs.paymentRequiredNotice', { amount: feeSettings.amount, currency: feeSettings.currency }) || `Payment of ${feeSettings.amount} ${feeSettings.currency} required to publish this job.`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openPaymentModal(job)}
                            disabled={payingJobId === job._id}
                            className="btn btn-primary btn-sm inline-flex items-center gap-2"
                          >
                            {payingJobId === job._id ? (
                              <>
                                <span className="animate-spin h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                                {t('employer.manageJobs.processing') || 'Processing...'}
                              </>
                            ) : (
                              <>
                                <FiCreditCard className="h-4 w-4" />
                                {t('employer.manageJobs.payNow') || 'Pay Now'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/employer/applicants/${job._id}`} className="btn btn-outline inline-flex items-center gap-2" title={t('sidebar.applicants')}>
                      <FiUsers />{t('sidebar.applicants')}
                    </Link>
                    <Link to={`/jobs/${job._id}`} className="btn btn-ghost" title={t('common.view')}>
                      <FiEye />
                    </Link>
                    <Link to={`/employer/post-job/${job._id}`} className="btn btn-ghost inline-flex items-center gap-2" title={t('common.edit')}>
                      <FiEdit2 />
                    </Link>
                    <button onClick={() => handleDelete(job._id)} className="btn btn-ghost text-red-500" title={t('common.delete')}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.open && paymentModal.job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FiCreditCard className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('employer.manageJobs.paymentModalTitle') || 'Complete Payment'}
                </h2>
                <p className="text-sm text-gray-500">{paymentModal.job.title}</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('employer.manageJobs.paymentAmount', { amount: feeSettings.amount, currency: feeSettings.currency }) || `Amount: ${feeSettings.amount} ${feeSettings.currency}`}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('employer.manageJobs.paymentMethod') || 'Payment Method'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="select w-full"
                  disabled={payingJobId}
                >
                  <option value="chapa">{t('employer.manageJobs.paymentMethods.chapa') || 'Chapa'}</option>
                  <option value="telebirr">{t('employer.manageJobs.paymentMethods.telebirr') || 'Telebirr'}</option>
                  <option value="bank_transfer">{t('employer.manageJobs.paymentMethods.bankTransfer') || 'Bank Transfer'}</option>
                  <option value="other">{t('employer.manageJobs.paymentMethods.other') || 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('employer.manageJobs.paymentReference') || 'Payment Reference / Transaction ID'}
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={t('employer.manageJobs.paymentReferencePlaceholder') || 'Enter transaction ID from payment provider'}
                  className="input w-full"
                  disabled={payingJobId}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('employer.manageJobs.paymentReferenceHint') || 'Enter the transaction ID you received from your payment provider (Chapa, Telebirr, etc.)'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={payingJobId}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={payingJobId}
                onClick={handlePaymentSubmit}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {payingJobId ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t('employer.manageJobs.processing') || 'Processing...'}
                  </>
                ) : (
                  t('employer.manageJobs.confirmPaymentBtn') || 'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;

