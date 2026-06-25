const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');

// @desc    Create/Book a new appointment
// @route   POST /api/appointments
// @access  Private (Patient/Admin)
exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, symptoms } = req.body;
    const patientId = req.user.role === 'admin' && req.body.patientId ? req.body.patientId : req.user.id;

    if (!doctorId || !appointmentDate || !appointmentTime || !symptoms) {
      res.status(400);
      throw new Error('Please fill in all booking details (doctorId, date, time, symptoms)');
    }

    // Verify doctor exists
    const doctorObj = await Doctor.findOne({ userId: doctorId });
    if (!doctorObj) {
      res.status(404);
      throw new Error('Selected doctor not found');
    }

    // Verify date is not in the past
    const bookDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (bookDate < today) {
      res.status(400);
      throw new Error('Cannot book appointments in the past');
    }

    // Check conflict: Has this slot already been booked for this doctor on this day?
    const conflict = await Appointment.findOne({
      doctorId,
      appointmentDate: bookDate,
      appointmentTime,
      status: 'Scheduled',
    });

    if (conflict) {
      res.status(400);
      throw new Error('This time slot is already booked for this doctor. Please choose another slot or date.');
    }

    // Retrieve patient profile to estimate copay based on insurance
    const patientProfile = await Patient.findOne({ userId: patientId });
    let calculatedCopay = 25.00;
    if (patientProfile && patientProfile.insuranceProvider && patientProfile.insuranceProvider !== 'None') {
      calculatedCopay = 15.00; // Copay is reduced with insurance coverage
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate: bookDate,
      appointmentTime,
      symptoms,
      copay: calculatedCopay,
      history: [
        {
          action: 'Appointment Scheduled',
          performedBy: req.user.name,
          timestamp: new Date(),
        },
      ],
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone');

    res.status(201).json({ success: true, data: populatedAppointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments filtered by role
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    }

    // Find and populate
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    // We can also fetch specialties for doctors dynamically
    const docs = await Doctor.find().populate('userId', 'name');
    const doctorSpecializations = {};
    docs.forEach(d => {
      if (d.userId) {
        doctorSpecializations[d.userId._id.toString()] = {
          specialization: d.specialization,
          department: d.department,
        };
      }
    });

    const data = appointments.map(appt => {
      const apptObj = appt.toObject();
      const specInfo = doctorSpecializations[appt.doctorId._id.toString()];
      if (specInfo) {
        apptObj.doctorProfile = specInfo;
      }
      return apptObj;
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone');

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    // Check authority
    if (
      req.user.role !== 'admin' &&
      appointment.patientId._id.toString() !== req.user.id &&
      appointment.doctorId._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to access this appointment details');
    }

    const apptObj = appointment.toObject();
    const docProfile = await Doctor.findOne({ userId: appointment.doctorId._id });
    if (docProfile) {
      apptObj.doctorProfile = {
        specialization: docProfile.specialization,
        department: docProfile.department,
        rating: docProfile.rating,
      };
    }

    res.json({ success: true, data: apptObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;

    if (!appointmentDate || !appointmentTime) {
      res.status(400);
      throw new Error('Please provide a new date and time');
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    // Check authority
    if (
      req.user.role !== 'admin' &&
      appointment.patientId.toString() !== req.user.id &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to modify this appointment');
    }

    // Check conflict for new date/time
    const bookDate = new Date(appointmentDate);
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      appointmentDate: bookDate,
      appointmentTime,
      status: 'Scheduled',
    });

    if (conflict) {
      res.status(400);
      throw new Error('The selected slot is already booked for this doctor. Please select another slot.');
    }

    const prevDate = appointment.appointmentDate.toISOString().split('T')[0];
    const prevTime = appointment.appointmentTime;

    appointment.appointmentDate = bookDate;
    appointment.appointmentTime = appointmentTime;
    appointment.status = 'Scheduled'; // Reset status if it was completed/cancelled (optional, or just update)
    appointment.history.push({
      action: `Rescheduled from ${prevDate} ${prevTime} to ${appointmentDate} ${appointmentTime}`,
      performedBy: req.user.name,
      timestamp: new Date(),
    });

    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (Cancel / Complete)
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!status || !['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status update. Must be Scheduled, Completed, or Cancelled');
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    // Check authority
    if (
      req.user.role !== 'admin' &&
      appointment.patientId.toString() !== req.user.id &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to update status');
    }

    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }

    appointment.history.push({
      action: `Status updated to ${status}`,
      performedBy: req.user.name,
      timestamp: new Date(),
    });

    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};
