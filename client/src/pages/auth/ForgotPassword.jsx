// ============================================
// Forgot Password Page
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiBriefcase } from 'react-icons/fi';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
      toast.success(t('auth.verifyEmail'));
      navigate('/reset-password', { state: { email: data.email }, replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <FiBriefcase className="w-10 h-10 text-primary-500 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-primary-500">{t('common.appName')}</h1>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">{t('auth.forgotPassword')}</h2>
          
          {!sent ? (
            <>
              <p className="text-center text-gray-600 mb-6">
                {t('auth.verifyEmail')}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      {...register('email', { required: t('auth.emailRequired') })}
                      className="input pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                  {loading ? t('common.loading') : t('auth.resetPassword')}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-green-600 mb-4">✅ {t('auth.verifyEmail')}</p>
            </div>
          )}

          <p className="text-center mt-6 text-sm">
            <Link to="/login" className="text-primary-500 hover:underline">
              {t('common.back')} {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
