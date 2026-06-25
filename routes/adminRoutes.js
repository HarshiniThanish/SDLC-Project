const express = require('express');
const router = express.Router();
const { getDashboardStats, createProcurement } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.route('/dashboard-stats')
  .get(getDashboardStats);

router.route('/procurement')
  .post(createProcurement);

module.exports = router;
