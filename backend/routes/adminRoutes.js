// ============================================
// Admin Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getUsers, getUserById, updateUser, suspendUser, deleteUser,
  getCompanies, approveCompany, verifyCompany, featureCompany,
  getJobs, approveJob, featureJob,
  getCategories, createCategory, updateCategory, deleteCategory,
  getSkills, createSkill, updateSkill, deleteSkill,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

// Companies
router.get('/companies', getCompanies);
router.put('/companies/:id/approve', approveCompany);
router.put('/companies/:id/verify', verifyCompany);
router.put('/companies/:id/feature', featureCompany);

// Jobs
router.get('/jobs', getJobs);
router.put('/jobs/:id/approve', approveJob);
router.put('/jobs/:id/feature', featureJob);

// Categories
router.route('/categories').get(getCategories).post(createCategory);
router.route('/categories/:id').put(updateCategory).delete(deleteCategory);

// Skills
router.route('/skills').get(getSkills).post(createSkill);
router.route('/skills/:id').put(updateSkill).delete(deleteSkill);

module.exports = router;
