// ============================================
// Protected Route Component
// ============================================
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const userRole = user?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
