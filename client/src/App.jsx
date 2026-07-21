// ============================================
// Main App Component - Routing Configuration
// ============================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store/store';
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

// Job Seeker Dashboard
import JobSeekerDashboard from './pages/dashboard/jobseeker/Dashboard';
import JobSeekerProfile from './pages/dashboard/jobseeker/Profile';
import MyApplications from './pages/dashboard/jobseeker/MyApplications';
import SavedJobs from './pages/dashboard/jobseeker/SavedJobs';
import ResumeBuilder from './pages/dashboard/jobseeker/ResumeBuilder';

// Employer Dashboard
import EmployerDashboard from './pages/dashboard/employer/Dashboard';
import PostJob from './pages/dashboard/employer/PostJob';
import ManageJobs from './pages/dashboard/employer/ManageJobs';
import ViewApplicants from './pages/dashboard/employer/ViewApplicants';
import CompanyProfile from './pages/dashboard/employer/CompanyProfile';

// Admin Dashboard
import AdminDashboard from './pages/dashboard/admin/Dashboard';
import ManageUsers from './pages/dashboard/admin/ManageUsers';
import ManageCompanies from './pages/dashboard/admin/ManageCompanies';
import ManageCategories from './pages/dashboard/admin/ManageCategories';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
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
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Job Seeker Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['jobseeker']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<JobSeekerDashboard />} />
            <Route path="resume" element={<ResumeBuilder />} />
            <Route path="profile" element={<JobSeekerProfile />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="saved-jobs" element={<SavedJobs />} />
          </Route>

          {/* Employer Dashboard */}
          <Route path="/employer" element={<ProtectedRoute allowedRoles={['employer']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<EmployerDashboard />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="applicants/:jobId" element={<ViewApplicants />} />
            <Route path="company" element={<CompanyProfile />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="companies" element={<ManageCompanies />} />
            <Route path="categories" element={<ManageCategories />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </AccessibilityProvider>
    </Provider>
  );
}

export default App;
