const express = require('express');
const router = express.Router();
const {
    getAgreements,
    getAgreementById,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    updateAgreementStatus,
    getActiveAgreements,
    getActiveAgreementByType,
    acceptAgreement,
    getAcceptedAgreements,
} = require('../controllers/agreementController');
const { protect, authorize } = require('../middleware/auth');

// Public / Employer endpoints (must be before admin middleware)
router.get('/active', getActiveAgreements);
router.get('/active/:type', getActiveAgreementByType);

// Protected employer endpoints
router.post('/accept', protect, authorize('employer', 'admin'), acceptAgreement);
router.get('/accepted', protect, authorize('employer', 'admin'), getAcceptedAgreements);

// Admin-only endpoints
router.use(protect, authorize('admin'));

router.route('/').get(getAgreements).post(createAgreement);
router.route('/:id').get(getAgreementById).put(updateAgreement).delete(deleteAgreement);
router.patch('/:id/status', updateAgreementStatus);

module.exports = router;