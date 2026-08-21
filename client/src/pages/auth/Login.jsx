// ============================================
// Login Page - OnlineJob Portal
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { FiMail, FiLock, FiBriefcase, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { login, googleLogin } from '../../store/slices/authSlice';

const Login = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const redirectByRole = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'employer') navigate('/employer');
    else navigate('/dashboard');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await dispatch(login(data)).unwrap();
      toast.success(t('auth.loginSuccess'));
      redirectByRole(result.user);
    } catch (error) {
      const msg = error?.message || (typeof error === 'string' ? error : t('auth.invalidCredentials'));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    try {
      if (!response?.credential) {
        toast.error(t('auth.googleLoginFailed'));
        return;
      }
      const result = await dispatch(googleLogin({ idToken: response.credential })).unwrap();
      toast.success(t('auth.loginSuccess'));
      redirectByRole(result.user);
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : t('auth.googleLoginFailed')));
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-4 sm:p-6">
      {/* ===== CENTERED LOGIN CARD ===== */}
      <div className="w-full max-w-[480px] overflow-hidden rounded-[32px] border border-blue-100/70 bg-white shadow-[0_35px_90px_-30px_rgba(47,77,172,0.45)] ring-1 ring-white/60 dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_35px_90px_-30px_rgba(0,0,0,0.6)] dark:ring-white/10">
        <div className="flex w-full flex-col bg-white dark:bg-gray-900">
          <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center px-8 py-12 sm:px-12">
          {/* Logo icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-white shadow-md shadow-blue-100/60 ring-8 ring-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none dark:ring-gray-900">
              <FiBriefcase className="h-7 w-7 text-[#1769E0] dark:text-blue-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="mt-5 text-center">
            <h3 className="text-3xl font-bold text-[#14213D] dark:text-gray-100">
              {t('common.appNameBrand')} <span className="text-[#1769E0] dark:text-blue-400">{t('common.appNameBrandHighlight')}</span>
            </h3>
            <p className="mt-2 text-base text-[#475569] dark:text-gray-400">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 w-full space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#14213D] dark:text-gray-100">{t('auth.email')}</label>
              <div className="relative">
                <FiMail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#1769E0] dark:text-blue-400" />
                <input
                  type="email"
                  {...register('email', { required: t('auth.emailRequired') })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3.5 pr-4 pl-12 text-[#0F172A] placeholder-slate-400 transition outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#14213D] dark:text-gray-100">{t('auth.password')}</label>
              <div className="relative">
                <FiLock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#1769E0] dark:text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: t('auth.passwordRequired') })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3.5 pr-12 pl-12 text-[#0F172A] placeholder-slate-400 transition outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-[#475569] transition hover:text-[#1769E0] dark:text-gray-400 dark:hover:text-blue-400"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Links */}
            <div className="flex flex-col items-end gap-2">
              <Link to="/forgot-password" className="text-sm font-medium text-[#1769E0] hover:underline dark:text-blue-400">
                {t('auth.forgotPassword')}
              </Link>
              <Link to="/verify-otp" className="text-sm font-medium text-[#1769E0] hover:underline dark:text-blue-400">
                {t('auth.verifyEmail')}
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center rounded-xl bg-[#1769E0] py-4 text-base font-bold text-white shadow-[0_10px_25px_-6px_rgba(23,105,224,0.55)] transition hover:bg-[#0D5BC4] hover:shadow-[0_12px_30px_-6px_rgba(23,105,224,0.6)] focus:ring-4 focus:ring-[#1769E0]/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
              <FiArrowRight className="absolute right-5 h-5 w-5" />
            </button>
          </form>

          {/* Divider */}
          <div className="mt-7 flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-slate-200 dark:bg-gray-800" />
            <span className="text-sm text-[#64748B] dark:text-gray-400">{t('common.or')}</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-gray-800" />
          </div>

          {/* Google Login Component */}
          <div className="mt-6 flex w-full justify-center">
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() => toast.error(t('auth.googleLoginFailed'))}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
              width="100%"
            />
          </div>

          {/* Register Link */}
          <p className="mt-7 text-center text-sm text-[#475569] dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-[#1769E0] hover:underline dark:text-blue-400">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Login;