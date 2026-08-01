// ============================================
// Register Page
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../services/api';
import { register as registerUser, setCredentials } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiBriefcase, FiEye, FiEyeOff, FiPhone, FiChevronDown, FiSearch } from 'react-icons/fi';
import countryOptions from '../../data/countryCodes';

const Register = () => {
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
    setValue('phone', `${selectedCountry.code}${phoneLocal}`.trim(), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedCountry, phoneLocal, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await dispatch(registerUser(data)).unwrap();
      // Save the email so OTP page can prefill
      try { localStorage.setItem('pendingVerificationEmail', data.email); } catch (e) {}
      toast.success('Registration successful! Please verify your email with the code sent.');
      navigate('/verify-otp');
    } catch (error) {
      const message =
        error?.errors?.length > 0
          ? error.errors.map((err) => err.message).join(', ')
          : error?.message || error || 'Registration failed';
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
            <FiBriefcase className="w-10 h-10 text-primary-500" />
            <span className="text-3xl font-bold text-primary-500">OnlineJob portal</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Create your account and start your journey</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  {...register('firstName', {
                    required: 'First name is required',
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: 'First name must contain only letters',
                    },
                  })}
                  className="input"
                  placeholder="Abebe"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', {
                    required: 'Last name is required',
                    pattern: {
                      value: /^[A-Za-z]+$/,
                      message: 'Last name must contain only letters',
                    },
                  })}
                  className="input"
                  placeholder="Bekele"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="relative space-y-2">
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCountryOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                  <FiChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                <div className="relative flex-1">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/[^0-9]/g, ''))}
                    className="input pl-10"
                    placeholder="912345678"
                    aria-label="Local phone number"
                  />
                </div>
              </div>
              {countryOpen && (
                <div className="absolute z-20 mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <FiSearch className="text-gray-400" />
                    <input
                      type="search"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country"
                      className="w-full bg-transparent text-sm text-gray-700 outline-none"
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
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-primary-50"
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-flex w-6 justify-center">{country.flag}</span>
                            <span>{country.label}</span>
                          </span>
                          <span className="text-xs text-gray-500">{country.code}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <input
                type="hidden"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\+251[0-9]{9}$/,
                    message: 'Please enter a valid phone number',
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
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: {
                      value: /(?=.*[0-9])(?=.*[a-zA-Z])/, 
                      message: 'Password must contain at least one letter and one number',
                    },
                  })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">I am a</label>
              <select {...register('role')} className="select">
                <option value="jobseeker">Job Seeker</option>
                <option value="employer">Employer</option>
              </select>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="h-px w-16 bg-gray-300"></span>
              <span>or sign up with</span>
              <span className="h-px w-16 bg-gray-300"></span>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse?.credential) {
                    setLoading(false);
                    return toast.error('Google sign-in failed.');
                  }

                  setLoading(true);
                  try {
                    const response = await api.post('/auth/google', {
                      idToken: credentialResponse.credential,
                    });
                    dispatch(setCredentials(response.data));
                    toast.success('Signed in with Google!');
                    const role = response.data?.user?.role;
                    if (role === 'admin') navigate('/admin');
                    else if (role === 'employer') navigate('/employer');
                    else navigate('/dashboard');
                  } catch (error) {
                    toast.error(error?.response?.data?.message || 'Google sign-in failed.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setLoading(false);
                  toast.error('Google sign-in failed.');
                }}
              />
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
