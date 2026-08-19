import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiKey, FiCheckCircle } from 'react-icons/fi';

const VerifyOTP = () => {
  const { t } = useTranslation();
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
      toast.success(t('auth.verifyEmail'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: data.email, code: data.code });
      toast.success(t('auth.verifyEmail'));
      try { localStorage.removeItem('pendingVerificationEmail'); } catch (e) {}
      navigate('/login');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="w-full max-w-md card">
        <div className="text-center mb-6">
          <FiCheckCircle className="mx-auto h-12 w-12 text-primary-500" />
          <h1 className="text-2xl font-bold mt-4">{t('auth.verifyEmail')}</h1>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                {...register('email', { required: t('auth.emailRequired') })}
                defaultValue={savedEmail}
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('auth.verifyEmail')}</label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                {...register('code', { required: t('common.error') })}
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
              {loading ? t('common.loading') : t('common.resend')}
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleVerifyCode)}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? t('common.loading') : t('auth.verifyEmail')}
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
