import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      email: location.state?.email || '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  });
  const password = watch('password');
  const emailValue = watch('email');

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        code: data.code,
        password: data.password,
      });
      toast.success(t('auth.resetPassword'));
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!emailValue) {
      toast.error(t('auth.emailRequired'));
      return;
    }

    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email: emailValue });
      setResendCountdown(60);
      toast.success(t('auth.verifyEmail'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="w-full max-w-md card">
        <h2 className="text-2xl font-bold text-center mb-6">{t('auth.resetPassword')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
            <input
              type="email"
              {...register('email', { required: t('auth.emailRequired') })}
              className="input"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.verifyEmail')}</label>
            <input
              type="text"
              inputMode="numeric"
              {...register('code', { required: t('common.error'), pattern: { value: /^\d{6}$/, message: 'Enter the 6-digit code' } })}
              className="input"
              placeholder="123456"
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: t('auth.passwordRequired') })}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: t('auth.passwordRequired'),
                  validate: (val) => val === password || t('auth.passwordMismatch'),
                })}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="flex justify-between items-center text-sm pt-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending || resendCountdown > 0}
              className="text-primary-500 hover:underline disabled:text-gray-400"
            >
              {resendCountdown > 0 ? `${resendCountdown}s` : t('common.resend')}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? t('common.loading') : t('auth.resetPassword')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          <Link to="/login" className="text-primary-500 hover:underline">
            {t('common.back')} {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
