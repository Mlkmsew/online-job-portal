import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md card text-center">
        {status === 'verifying' && <p>{t('auth.verifyingEmail')}</p>}
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4 dark:text-emerald-400">✅ {t('auth.emailVerified')}</h2>
            <p className="mb-4">{t('auth.emailVerifiedSuccess')}</p>
            <Link to="/login" className="btn btn-primary">{t('auth.goToLogin')}</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4 dark:text-red-400">❌ {t('auth.verificationFailed')}</h2>
            <p className="mb-4">{t('auth.verificationLinkInvalid')}</p>
            <Link to="/login" className="btn btn-primary">{t('auth.goToLogin')}</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
