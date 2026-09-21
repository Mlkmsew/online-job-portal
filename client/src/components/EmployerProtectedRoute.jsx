// ============================================
// Employer Protected Route - Checks agreement acceptance
// ============================================
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const EmployerProtectedRoute = ({ children }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-200">{t('common.loading', { defaultValue: 'Loading...' })}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = user?.role?.toLowerCase();
  if (userRole !== 'employer') {
    return <Navigate to="/" replace />;
  }

  // Check if employer has accepted both agreements
  const termsAccepted = user?.termsAccepted || false;
  const privacyAccepted = user?.privacyAccepted || false;

  // Allow access to agreements page and settings without checking acceptance
  const publicPaths = ['/employer/agreements', '/employer/settings', '/employer/settings/change-password'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  if (!isPublicPath && (!termsAccepted || !privacyAccepted)) {
    return <Navigate to="/employer/agreements" replace state={{ from: location }} />;
  }

  return children;
};

export default EmployerProtectedRoute;