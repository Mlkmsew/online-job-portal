import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiKey, FiCheckCircle, FiClock } from 'react-icons/fi';

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
};

const VerifyOTP = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text }
  const [remainingResends, setRemainingResends] = useState(null);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [, setTick] = useState(0);
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') || '' : '';
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Live countdown while blocked; re-enables Resend automatically at zero
  useEffect(() => {
    if (!blockedUntil) return undefined;
    const interval = setInterval(() => {
      if (Date.now() >= blockedUntil) {
        setBlockedUntil(null);
        setNotice({ type: 'success', text: 'You can request a new verification code now.' });
      }
      setTick((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const isBlocked = Boolean(blockedUntil && Date.now() < blockedUntil);

  const handleSendCode = async (data) => {
    if (sending || isBlocked) return;
    setSending(true);
    setNotice(null);
    try {
      // skipGlobalErrorToast: the page renders its own meaningful message
      const response = await api.post(
        '/auth/send-otp',
        { email: data.email },
        { skipGlobalErrorToast: true }
      );
      const payload = response?.data || {};
      if (typeof payload.remainingResends === 'number') {
        setRemainingResends(payload.remainingResends);
      }
      if (payload.blocked && Number.isFinite(payload.retryAfterSeconds)) {
        setBlockedUntil(Date.now() + payload.retryAfterSeconds * 1000);
      }
      setNotice({
        type: 'success',
        text:
          payload.message ||
          'A new verification code has been sent to your email.',
      });
      toast.success('A new verification code has been sent to your email.');
    } catch (error) {
      const resp = error?.response?.data;
      if (error?.response?.status === 429 && (resp?.blocked || Number.isFinite(resp?.retryAfterSeconds))) {
        const seconds = Number.isFinite(resp?.retryAfterSeconds)
          ? resp.retryAfterSeconds
          : 4 * 60 * 60;
        setBlockedUntil(Date.now() + seconds * 1000);
        setNotice({
          type: 'error',
          text: `Too many resend attempts. Please try again in ${formatCountdown(seconds * 1000)}.`,
        });
      } else {
        setNotice({
          type: 'error',
          text: resp?.message || t('common.error'),
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (data) => {
    setVerifying(true);
    try {
      await api.post('/auth/verify-otp', { email: data.email, code: data.code });
      toast.success(t('auth.verifyEmail'));
      try { localStorage.removeItem('pendingVerificationEmail'); } catch (e) {}
      navigate('/login');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('common.error'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md card">
        <div className="text-center mb-6">
          <FiCheckCircle className="mx-auto h-12 w-12 text-primary-500" />
          <h1 className="text-2xl font-bold mt-4">{t('auth.verifyEmail')}</h1>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                {...register('email', { required: t('auth.emailRequired') })}
                defaultValue={savedEmail}
                className="input pl-10"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.verifyEmail')}</label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                inputMode="numeric"
                {...register('code', { required: t('common.error') })}
                className="input pl-10"
                placeholder="123456"
              />
            </div>
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>

          {isBlocked && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
            >
              <FiClock className="mt-0.5 shrink-0" />
              <span>
                Too many resend attempts. Please try again in{' '}
                {formatCountdown((blockedUntil || 0) - Date.now())}.
              </span>
            </div>
          )}

          {notice && !isBlocked && (
            <div
              role={notice.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={
                notice.type === 'success'
                  ? 'rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200'
                  : 'rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300'
              }
            >
              {notice.text}
            </div>
          )}

          {typeof remainingResends === 'number' && !isBlocked && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {remainingResends > 0
                ? `${remainingResends} resend attempt${remainingResends !== 1 ? 's' : ''} remaining.`
                : 'No resend attempts remaining.'}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={handleSubmit(handleSendCode)}
              disabled={sending || verifying || isBlocked}
              className="btn btn-secondary w-full"
            >
              {sending ? t('common.loading') : t('common.resend')}
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleVerifyCode)}
              disabled={verifying || sending}
              className="btn btn-primary w-full"
            >
              {verifying ? t('common.loading') : t('auth.verifyEmail')}
            </button>
          </div>

          <p className="text-center mt-6 text-sm">
            <Link to="/login" className="text-primary-500 hover:underline">
              {t('common.back')} {t('auth.login')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
