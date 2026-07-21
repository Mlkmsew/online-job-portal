// ============================================
// useAuth Hook - Access Auth State
// ============================================
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const isJobSeeker = user?.role === 'jobseeker';
  const isEmployer = user?.role === 'employer';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isAuthenticated,
    loading,
    isJobSeeker,
    isEmployer,
    isAdmin,
  };
};

export default useAuth;
