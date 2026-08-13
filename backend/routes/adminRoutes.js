// ============================================
// Admin Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getReportsStats, getPlatformActivity,
  getAdminApplications, deleteApplication,
  getUsers, getUserById, updateUser, updateUserStatus, suspendUser, deleteUser,
  getCompanies, approveCompany, rejectCompany, verifyCompany, featureCompany,
  getJobs, approveJob, rejectJob, featureJob,
  getCategories, createCategory, updateCategory, deleteCategory,
  getSkills, createSkill, updateSkill, deleteSkill,
} = require('../controllers/adminController');
const {
  getAllVerifications,
  getVerification,
  reviewVerification,
  suspendUserForFraud,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activity', getPlatformActivity);

// Reports & Statistics
router.get('/reports', getReportsStats);

// Applications
router.get('/applications', getAdminApplications);
router.delete('/applications/:id', deleteApplication);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.put('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

// Companies
router.get('/companies', getCompanies);
router.put('/companies/:id/approve', approveCompany);
router.put('/companies/:id/reject', rejectCompany);
router.put('/companies/:id/verify', verifyCompany);
router.put('/companies/:id/feature', featureCompany);

// Jobs
router.get('/jobs', getJobs);
router.put('/jobs/:id/approve', approveJob);
router.put('/jobs/:id/reject', rejectJob);
router.put('/jobs/:id/feature', featureJob);

// Categories
router.route('/categories').get(getCategories).post(createCategory);
router.route('/categories/:id').put(updateCategory).delete(deleteCategory);

// Skills
router.route('/skills').get(getSkills).post(createSkill);
router.route('/skills/:id').put(updateSkill).delete(deleteSkill);

// Certificate Verification & Fraud Detection
router.get('/certificates', getAllVerifications);
router.get('/certificates/:id', getVerification);
router.put('/certificates/:id/review', reviewVerification);
router.put('/certificates/:id/suspend-user', suspendUserForFraud);

module.exports = router;
