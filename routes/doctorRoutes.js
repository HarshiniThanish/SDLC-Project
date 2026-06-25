const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, updateDoctorSlots } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getDoctors);

router.route('/:id')
  .get(protect, getDoctorById);

router.route('/:id/slots')
  .put(protect, authorize('doctor', 'admin'), updateDoctorSlots);

module.exports = router;
