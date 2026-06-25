const Patient = require('../models/Patient');
const User = require('../models/User');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin/Doctor)
exports.getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find().populate('userId', 'name email phone');
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile by userId or PatientId
// @route   GET /api/patients/:id
// @access  Private
exports.getPatientById = async (req, res, next) => {
  try {
    let patient = await Patient.findOne({ userId: req.params.id }).populate('userId', 'name email phone');
    
    if (!patient) {
      patient = await Patient.findById(req.params.id).populate('userId', 'name email phone');
    }

    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    // Ensure users can only view their own profile, unless they are admin/doctor
    if (req.user.role === 'patient' && req.user.id !== patient.userId._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this profile');
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findOne({ userId: req.params.id });
    
    if (!patient) {
      patient = await Patient.findById(req.params.id);
    }

    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    // Authorization check
    if (req.user.role === 'patient' && req.user.id !== patient.userId.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this profile');
    }

    const { age, address, insuranceProvider, policyHolder, medicalHistory, name, phone } = req.body;

    // Update User name & phone if provided
    if (name || phone) {
      const user = await User.findById(patient.userId);
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    }

    // Update Patient profile
    patient.age = age || patient.age;
    patient.address = address !== undefined ? address : patient.address;
    patient.insuranceProvider = insuranceProvider !== undefined ? insuranceProvider : patient.insuranceProvider;
    patient.policyHolder = policyHolder !== undefined ? policyHolder : patient.policyHolder;
    patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;

    await patient.save();

    const updatedPatient = await Patient.findById(patient._id).populate('userId', 'name email phone');
    res.json({ success: true, data: updatedPatient });
  } catch (error) {
    next(error);
  }
};
