// ============================================
// Login Page
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { login } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiBriefcase, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await dispatch(login(data)).unwrap();
      toast.success('Login successful!');
      
      // Redirect based on role
      if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'employer') navigate('/employer');
      else navigate('/dashboard');
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FiBriefcase className="w-10 h-10 text-primary-500" />
            <span className="text-3xl font-bold text-primary-500">OnlineJob portal</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Welcome! Please login to your account</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
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

            {/* Forgot Password */}
            <div className="text-right">
              <div className="flex flex-col gap-2 text-right">
                <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline">
                  Forgot Password?
                </Link>
                <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline">
                  Verify email with code
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
