const express = require('express');
const router = express.Router();
const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('doctor', 'admin'), createMedicalRecord)
  .get(protect, getMedicalRecords);

router.route('/:id')
  .get(protect, getMedicalRecordById);

module.exports = router;
