const express = require('express');
const router = express.Router();
const {
  getJobAlerts,
  createJobAlert,
  updateJobAlert,
  deleteJobAlert,
} = require('../controllers/jobAlertController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getJobAlerts).post(createJobAlert);
router.route('/:id').put(updateJobAlert).delete(deleteJobAlert);

module.exports = router;
