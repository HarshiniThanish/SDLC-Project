const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  rescheduleAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createAppointment)
  .get(protect, getAppointments);

router.route('/:id')
  .get(protect, getAppointmentById);

router.route('/:id/reschedule')
  .put(protect, rescheduleAppointment);

router.route('/:id/status')
  .put(protect, updateAppointmentStatus);

module.exports = router;
