import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiKey, FiSend, FiCheckCircle } from 'react-icons/fi';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') || '' : '';
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleSendCode = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: data.email });
      setCodeSent(true);
      toast.success('Verification code sent to your email.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: data.email, code: data.code });
      toast.success('Email verified successfully!');
      try { localStorage.removeItem('pendingVerificationEmail'); } catch (e) {}
      navigate('/login');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="w-full max-w-md card">
        <div className="text-center mb-6">
          <FiCheckCircle className="mx-auto h-12 w-12 text-primary-500" />
          <h1 className="text-2xl font-bold mt-4">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">Enter your email and the verification code sent to you.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                defaultValue={savedEmail}
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Verification Code</label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                {...register('code', { required: 'Verification code is required' })}
                className="input pl-10"
                placeholder="123456"
              />
            </div>
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={handleSubmit(handleSendCode)}
              disabled={loading}
              className="btn btn-secondary w-full"
            >
              {loading ? 'Sending…' : 'Resend Code'}
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleVerifyCode)}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </div>

          {codeSent && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
              A verification code has been sent to your email. Please check your inbox or spam folder.
            </div>
          )}

          <p className="text-center text-sm text-gray-600">
            Already verified?{' '}
            <Link to="/login" className="text-primary-500 hover:underline">
              Return to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
