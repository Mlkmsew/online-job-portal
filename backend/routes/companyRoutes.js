// ============================================
// Company Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany, uploadLogo, getMyCompany,
} = require('../controllers/companyController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');
const { uploadLogo: logoUpload } = require('../config/cloudinary');
const { companyValidator, validate } = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.get('/', getCompanies);
router.get('/my/company', protect, authorize('employer', 'admin'), requireEmailVerified, getMyCompany);
router.get('/:id', getCompany);

router.use(protect, authorize('employer', 'admin'), requireEmailVerified);
router.post('/', logoUpload.single('logo'), companyValidator, validate, createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.put('/:id/logo', uploadLimiter, logoUpload.single('logo'), uploadLogo);

module.exports = router;
