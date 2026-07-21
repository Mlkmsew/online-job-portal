import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import JobSeekerDashboard from '../pages/dashboard/JobSeekerDashboard';
import JobDetailsPage from '../pages/JobDetailsPage';
import JobsPage from '../pages/JobsPage';
import NotFoundPage from '../pages/NotFoundPage';
import PrivateRoute from '../components/PrivateRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageCompanies from '../pages/admin/ManageCompanies';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/jobs" element={<JobsPage />} />
    <Route path="/jobs/:slug" element={<JobDetailsPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/dashboard" element={<PrivateRoute><JobSeekerDashboard /></PrivateRoute>} />
    <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
    <Route path="/admin/users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />
    <Route path="/admin/companies" element={<PrivateRoute><ManageCompanies /></PrivateRoute>} />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default AppRoutes;
