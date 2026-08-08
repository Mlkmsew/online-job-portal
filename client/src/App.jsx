// ============================================
// Main App Component - Routing Configuration
// ============================================
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store/store';
import { initializeAuth } from './store/slices/authSlice';
import './i18n/config'; // Initialize i18next
import ChatWidget from './components/chat/ChatWidget'; // Real-time chat
import { AccessibilityProvider } from './context/AccessibilityContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import JobApply from './pages/JobApply';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import CareerGuide from './pages/CareerGuide';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyOTP from './pages/auth/VerifyOTP';

// Job Seeker Dashboard
import JobSeekerDashboard from './pages/dashboard/jobseeker/Dashboard';
import JobSeekerProfile from './pages/dashboard/jobseeker/Profile';
import MyApplications from './pages/dashboard/jobseeker/MyApplications';
import JobSeekerInterviewDetails from './pages/dashboard/jobseeker/InterviewDetails';
import SavedJobs from './pages/dashboard/jobseeker/SavedJobs';
import ResumeBuilder from './pages/dashboard/jobseeker/ResumeBuilder';
import FindJobs from './pages/dashboard/jobseeker/FindJobs';
import SkillAssessment from './pages/dashboard/jobseeker/SkillAssessment';
import JobAlerts from './pages/dashboard/jobseeker/JobAlerts';
import Messages from './pages/dashboard/jobseeker/Messages';
import CareerResources from './pages/dashboard/jobseeker/CareerResources';
import Settings from './pages/dashboard/jobseeker/Settings';
import ChangePassword from './pages/dashboard/jobseeker/ChangePassword';

// Employer Dashboard
import EmployerDashboard from './pages/dashboard/employer/Dashboard';
import PostJob from './pages/dashboard/employer/PostJob';
import ManageJobs from './pages/dashboard/employer/ManageJobs';
import EmployerApplications from './pages/dashboard/employer/EmployerApplications';
import EmployerInterviews from './pages/dashboard/employer/EmployerInterviews';
import InterviewDetails from './pages/dashboard/employer/InterviewDetails';
import EmployerMessages from './pages/dashboard/employer/EmployerMessages';
import EmployerSettings from './pages/dashboard/employer/EmployerSettings';
import ViewApplicants from './pages/dashboard/employer/ViewApplicants';
import CompanyProfile from './pages/dashboard/employer/CompanyProfile';

// Admin Dashboard
import AdminDashboard from './pages/dashboard/admin/Dashboard';
import ManageUsers from './pages/dashboard/admin/ManageUsers';
import ManageCompanies from './pages/dashboard/admin/ManageCompanies';
import CreateCompany from './pages/dashboard/admin/CreateCompany';
import AdminManageJobs from './pages/dashboard/admin/AdminManageJobs';
import ManageCategories from './pages/dashboard/admin/ManageCategories';
import AdminApplications from './pages/dashboard/admin/AdminApplications';
import AdminReports from './pages/dashboard/admin/AdminReports';
import AdminMessages from './pages/dashboard/admin/AdminMessages';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <AccessibilityProvider>
      <Router>
        <Toaster position="top-right" />
        <ChatWidget /> {/* Floating chat widget */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="jobs/:id/apply" element={<JobApply />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:id" element={<CompanyDetails />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="career-guide" element={<CareerGuide />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Job Seeker Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['jobseeker']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<JobSeekerDashboard />} />
            <Route path="find-jobs" element={<FindJobs />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="interviews/:id" element={<JobSeekerInterviewDetails />} />
            <Route path="saved-jobs" element={<SavedJobs />} />
            <Route path="profile" element={<JobSeekerProfile />} />
            <Route path="resume" element={<ResumeBuilder />} />
            <Route path="skill-assessment" element={<SkillAssessment />} />
            <Route path="job-alerts" element={<JobAlerts />} />
            <Route path="messages" element={<Messages />} />
            <Route path="career-resources" element={<CareerResources />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/change-password" element={<ChangePassword />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Employer Dashboard */}
          <Route path="/employer" element={<ProtectedRoute allowedRoles={['employer']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<EmployerDashboard />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="post-job/:id" element={<PostJob />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="manage-jobs" element={<Navigate to="/employer/jobs" replace />} />
            <Route path="applications" element={<Navigate to="/employer/applicants" replace />} />
            <Route path="interviews" element={<EmployerInterviews />} />
            <Route path="interviews/:id" element={<InterviewDetails />} />
            <Route path="messages" element={<EmployerMessages />} />
            <Route path="settings" element={<EmployerSettings />} />
            <Route path="applicants" element={<ViewApplicants />} />
            <Route path="applicants/:jobId" element={<ViewApplicants />} />
            <Route path="company" element={<CompanyProfile />} />
            <Route path="*" element={<Navigate to="/employer" replace />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="companies" element={<ManageCompanies />} />
            <Route path="companies/new" element={<CreateCompany />} />
            <Route path="jobs" element={<AdminManageJobs />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AccessibilityProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}

export default App;
