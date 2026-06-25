const express = require('express');
const router = express.Router();
const { getPatients, getPatientById, updatePatient } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'doctor'), getPatients);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, updatePatient);

module.exports = router;
