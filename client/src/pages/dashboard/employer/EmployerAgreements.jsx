import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../../services/api';
import agreementService from '../../../services/agreementService';
import { setUser } from '../../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  FiFileText, FiShield, FiCheckCircle, FiChevronRight,
  FiX, FiAlertCircle, FiEye
} from 'react-icons/fi';

const EmployerAgreements = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [agreements, setAgreements] = useState({ terms: null, privacy: null });
  const [accepted, setAccepted] = useState({ terms: false, privacy: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    fetchAgreements();
    checkUserAcceptance();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await agreementService.getActive();
      const data = response.data.data || [];
      const terms = data.find(a => a.type === 'terms');
      const privacy = data.find(a => a.type === 'privacy');
      setAgreements({ terms, privacy });
    } catch (error) {
      console.error('Failed to fetch agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAcceptance = async () => {
    try {
      const response = await agreementService.getAccepted();
      const data = response.data.data || {};
      setAccepted({
        terms: data.termsAccepted || false,
        privacy: data.privacyAccepted || false,
      });
    } catch (error) {
      console.error('Failed to fetch acceptance status:', error);
    }
  };

  const handleAccept = async (type) => {
    const agreement = agreements[type];
    if (!agreement) return;

    setSubmitting(true);
    try {
      await agreementService.accept(agreement._id, type);
      setAccepted(prev => ({ ...prev, [type]: true }));
      toast.success(t('employer.agreements.acceptSuccess'));

      // Check if both are now accepted
      const newAccepted = { ...accepted, [type]: true };
      if (newAccepted.terms && newAccepted.privacy) {
        // Update user in Redux store
        const userResponse = await api.get('/auth/me');
        if (userResponse.data?.data) {
          dispatch(setUser(userResponse.data.data));
        }
        // Navigate to employer dashboard
        navigate('/employer', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('employer.agreements.acceptFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!accepted.terms) {
      handleAccept('terms');
    }
    if (!accepted.privacy) {
      handleAccept('privacy');
    }
  };

  const canContinue = accepted.terms && accepted.privacy;
  const hasTerms = !!agreements.terms;
  const hasPrivacy = !!agreements.privacy;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#142A24]">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="h-4 w-4 rounded-full border-2 border-[#1769E0] border-t-transparent animate-spin" />
          <span>{t('employer.agreements.loading')}</span>
        </div>
      </div>
    );
  }

  if (!hasTerms && !hasPrivacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#142A24] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <FiAlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#14231F] dark:text-white mb-2">
            {t('employer.agreements.unavailable')}
          </h3>
          <p className="text-sm text-[#64746E] dark:text-[#A9BBB4]">
            {t('employer.agreements.termsUnavailable')} {t('employer.agreements.privacyUnavailable')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#142A24] px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#EAF2FE] dark:bg-[#041D3F]/40 flex items-center justify-center mb-4">
            <FiShield className="h-8 w-8 text-[#1769E0] dark:text-[#3B82F6]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14231F] dark:text-white">
            {t('employer.agreements.pageTitle')}
          </h1>
          <p className="mt-2 text-sm text-[#64746E] dark:text-[#A9BBB4]">
            {t('employer.agreements.pageSubtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Terms of Service Card */}
          <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                  <FiFileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#14231F] dark:text-white">
                    {agreements.terms?.title || t('employer.agreements.termsOfService.title')}
                  </h3>
                  <p className="mt-1 text-sm text-[#64746E] dark:text-[#A9BBB4] max-w-md">
                    {agreements.terms?.description || t('employer.agreements.termsOfService.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {accepted.terms ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    <FiCheckCircle className="h-4 w-4" />
                    <span>{t('common.accepted')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/50"
                  >
                    <FiEye className="h-4 w-4" />
                    <span>{t('employer.agreements.termsOfService.readFull')}</span>
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Policy Card */}
          <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <FiShield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#14231F] dark:text-white">
                    {agreements.privacy?.title || t('employer.agreements.privacyPolicy.title')}
                  </h3>
                  <p className="mt-1 text-sm text-[#64746E] dark:text-[#A9BBB4] max-w-md">
                    {agreements.privacy?.description || t('employer.agreements.privacyPolicy.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {accepted.privacy ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    <FiCheckCircle className="h-4 w-4" />
                    <span>{t('common.accepted')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 transition hover:bg-violet-100 dark:hover:bg-violet-900/50"
                  >
                    <FiEye className="h-4 w-4" />
                    <span>{t('employer.agreements.privacyPolicy.readFull')}</span>
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Acceptance Checkboxes */}
          <div className="rounded-2xl border border-[#E1E8E4] dark:border-[#23483D] bg-white dark:bg-[#142A24] p-6 shadow-sm space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.terms}
                onChange={() => handleAccept('terms')}
                disabled={!hasTerms || accepted.terms || submitting}
                className="mt-1 h-4 w-4 rounded border-[#E1E8E4] text-[#1769E0] focus:ring-[#1769E0] disabled:opacity-50"
              />
              <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">
                {t('employer.agreements.acceptTerms')}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.privacy}
                onChange={() => handleAccept('privacy')}
                disabled={!hasPrivacy || accepted.privacy || submitting}
                className="mt-1 h-4 w-4 rounded border-[#E1E8E4] text-[#1769E0] focus:ring-[#1769E0] disabled:opacity-50"
              />
              <span className="text-sm text-[#374151] dark:text-[#D1D5DB]">
                {t('employer.agreements.acceptPrivacy')}
              </span>
            </label>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasTerms || !hasPrivacy || canContinue}
            className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
              canContinue
                ? 'bg-emerald-600 text-white cursor-default'
                : submitting
                ? 'bg-[#1769E0] text-white cursor-wait'
                : 'bg-[#1769E0] text-white hover:bg-[#0D5BC4] cursor-pointer'
            }`}
          >
            {submitting
              ? 'Accepting...'
              : canContinue
              ? t('common.continue')
              : t('employer.agreements.acceptAndContinue')}
          </button>

          {!hasTerms && (
            <p className="text-center text-sm text-rose-500 dark:text-rose-400">
              {t('employer.agreements.termsUnavailable')}
            </p>
          )}
          {!hasPrivacy && (
            <p className="text-center text-sm text-rose-500 dark:text-rose-400">
              {t('employer.agreements.privacyUnavailable')}
            </p>
          )}
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && agreements.terms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-[#142A24] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] px-6 py-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 mb-2">
                  {t('employer.agreements.termsOfService.title')}
                </span>
                <h2 className="text-lg font-semibold text-[#14231F] dark:text-white">{agreements.terms.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-2 rounded-lg text-[#64746E] dark:text-[#A9BBB4] hover:bg-[#F0F4F2] dark:hover:bg-[#10231E] transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                  {agreements.terms.content}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E8E4] dark:border-[#23483D] flex items-center justify-between text-sm text-[#64746E] dark:text-[#A9BBB4]">
                <span>{t('employer.agreements.version')} {agreements.terms.version || 1}</span>
                <span>{t('employer.agreements.lastUpdated')} {new Date(agreements.terms.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="border-t border-[#E1E8E4] dark:border-[#23483D] px-6 py-4">
              <button
                type="button"
                onClick={() => { setShowTermsModal(false); handleAccept('terms'); }}
                className="w-full rounded-xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
              >
                {t('employer.agreements.acceptTerms')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && agreements.privacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-[#142A24] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E1E8E4] dark:border-[#23483D] px-6 py-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 mb-2">
                  {t('employer.agreements.privacyPolicy.title')}
                </span>
                <h2 className="text-lg font-semibold text-[#14231F] dark:text-white">{agreements.privacy.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 rounded-lg text-[#64746E] dark:text-[#A9BBB4] hover:bg-[#F0F4F2] dark:hover:bg-[#10231E] transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                  {agreements.privacy.content}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E8E4] dark:border-[#23483D] flex items-center justify-between text-sm text-[#64746E] dark:text-[#A9BBB4]">
                <span>{t('employer.agreements.version')} {agreements.privacy.version || 1}</span>
                <span>{t('employer.agreements.lastUpdated')} {new Date(agreements.privacy.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="border-t border-[#E1E8E4] dark:border-[#23483D] px-6 py-4">
              <button
                type="button"
                onClick={() => { setShowPrivacyModal(false); handleAccept('privacy'); }}
                className="w-full rounded-xl bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5BC4]"
              >
                {t('employer.agreements.acceptPrivacy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerAgreements;