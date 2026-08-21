// ============================================
// Register Page
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../services/api';
import { register as registerUser, setCredentials } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiBriefcase, FiEye, FiEyeOff, FiPhone, FiChevronDown, FiSearch } from 'react-icons/fi';
import countryOptions from '../../data/countryCodes';

const Register = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    countryOptions.find((country) => country.code === '+251') || countryOptions[0]
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const password = watch('password');

  useEffect(() => {
    let full = `${selectedCountry.code}${phoneLocal}`.trim();
    if (selectedCountry.code === '+251' && phoneLocal.startsWith('0')) {
      full = `+251${phoneLocal.slice(1)}`;
    }
    setValue('phone', full, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedCountry, phoneLocal, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await dispatch(registerUser(data)).unwrap();
      try { localStorage.setItem('pendingVerificationEmail', data.email); } catch (e) {}
      toast.success(t('auth.registerSuccess'));
      navigate('/verify-otp');
    } catch (error) {
      const message =
        error?.errors?.length > 0
          ? error.errors.map((err) => err.message).join(', ')
          : error?.message || error || t('common.error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FiBriefcase className="w-10 h-10 text-[#1769E0]" />
            <span className="text-3xl font-bold text-[#1769E0]">{t('common.appName')}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.tagline')}</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">{t('auth.register')}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('auth.firstName')}</label>
                <input
                  type="text"
                  maxLength={13}
                  {...register('firstName', {
                    required: t('auth.firstNameRequired'),
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: t('auth.firstNameLetters'),
                    },
                  })}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^A-Za-z]/g, '');
                    if (filtered !== e.target.value) e.target.value = filtered;
                    setValue('firstName', filtered, { shouldValidate: true });
                  }}
                  className="input"
                  placeholder={t('auth.firstNamePlaceholder')}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('auth.lastName')}</label>
                <input
                  type="text"
                  maxLength={13}
                  {...register('lastName', {
                    required: t('auth.lastNameRequired'),
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: t('auth.lastNameLetters'),
                    },
                  })}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^A-Za-z]/g, '');
                    if (filtered !== e.target.value) e.target.value = filtered;
                    setValue('lastName', filtered, { shouldValidate: true });
                  }}
                  className="input"
                  placeholder={t('auth.lastNamePlaceholder')}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  {...register('email', { required: t('auth.emailRequired') })}
                  className="input pl-10"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="relative space-y-2">
              <label className="block text-sm font-medium mb-2">{t('footer.phone')}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCountryOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                  <FiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                <div className="relative flex-1">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, '');
                      if (selectedCountry.code === '+251') {
                        if (v.length > 10) v = v.slice(0, 10);
                        if (v === '') { setPhoneLocal(''); return; }
                        if (!v.startsWith('0')) return;
                        if (v.length >= 2 && v[1] !== '9') v = v.slice(0, 1);
                      }
                      setPhoneLocal(v);
                    }}
                    className="input pl-10"
                    placeholder="912345678"
                    aria-label={t('auth.localPhoneNumber')}
                  />
                </div>
              </div>
              {countryOpen && (
                <div className="absolute z-20 mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                    <FiSearch className="text-gray-400 dark:text-gray-500" />
                    <input
                      type="search"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder={t('auth.searchCountry')}
                      className="w-full bg-transparent text-sm text-gray-700 outline-none dark:text-gray-300"
                    />
                  </div>
                  <div className="max-h-48 overflow-auto">
                    {countryOptions
                      .filter((country) =>
                        country.label.toLowerCase().includes(countrySearch.toLowerCase()) ||
                        country.code.includes(countrySearch)
                      )
                      .map((country) => (
                        <button
                          type="button"
                          key={`${country.code}-${country.label}`}
                          onClick={() => {
                            setSelectedCountry(country);
                            setCountryOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-primary-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-flex w-6 justify-center">{country.flag}</span>
                            <span>{country.label}</span>
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{country.code}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <input
                type="hidden"
                {...register('phone', {
                  required: t('auth.phoneRequired'),
                  pattern: {
                    value: /^\+2519[0-9]{8}$/,
                    message: t('auth.phoneInvalid'),
                  },
                  setValueAs: (value) => {
                    const digits = String(value || '').replace(/\D/g, '');
                    if (!digits) return '';
                    if (digits.startsWith('251')) return `+${digits}`;
                    if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
                    return `+251${digits}`;
                  },
                })}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.password')}</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: { value: 8, message: t('auth.weakPassword') },
                  })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: t('auth.passwordRequired'),
                    validate: value => value === password || t('auth.passwordMismatch')
                  })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.user')}</label>
              <select {...register('role')} className="select">
                <option value="jobseeker">{t('roles.jobSeeker')}</option>
                <option value="employer">{t('roles.employer')}</option>
              </select>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            {t('nav.login')}{' '}
            <Link to="/login" className="text-primary-500 hover:underline font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
