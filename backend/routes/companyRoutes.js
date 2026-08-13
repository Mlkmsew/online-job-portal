// ============================================
// Company Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  getCompanies, getTrustedCompanies, getCompany, createCompany, updateCompany, deleteCompany, uploadLogo, getMyCompany,
} = require('../controllers/companyController');
const { protect, authorize, requireEmailVerified } = require('../middleware/auth');
const { uploadLogo: logoUpload, uploadCompany } = require('../config/cloudinary');
const { companyValidator, validate } = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.get('/', getCompanies);
router.get('/trusted', getTrustedCompanies);
router.get('/my/company', protect, authorize('employer', 'admin'), requireEmailVerified, getMyCompany);
router.get('/:id', getCompany);

router.use(protect, authorize('employer', 'admin'), requireEmailVerified);
const companyUploadFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'tinCertificate', maxCount: 1 },
  { name: 'companyRegistration', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
];
router.post('/', uploadCompany.fields(companyUploadFields), companyValidator, validate, createCompany);
router.put('/:id', uploadCompany.fields(companyUploadFields), updateCompany);
router.delete('/:id', deleteCompany);
router.put('/:id/logo', uploadLimiter, logoUpload.single('logo'), uploadLogo);

module.exports = router;
