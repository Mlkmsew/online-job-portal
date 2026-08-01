const express = require('express');
const router = express.Router();
const {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  toggleSavedSearchNotify,
} = require('../controllers/savedSearchController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getSavedSearches).post(createSavedSearch);
router.route('/:id').put(updateSavedSearch).delete(deleteSavedSearch);
router.patch('/:id/toggle-notification', toggleSavedSearchNotify);

module.exports = router;
