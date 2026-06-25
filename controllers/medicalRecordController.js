const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');

// @desc    Create a new medical record
// @route   POST /api/medical-records
// @access  Private (Doctor only)
exports.createMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, diagnosis, prescription, notes, relatedDocuments } = req.body;
    const doctorId = req.user.id;

    if (!patientId || !diagnosis) {
      res.status(400);
      throw new Error('Please provide at least a patientId and a diagnosis');
    }

    // Check if patient profile exists
    const patientObj = await Patient.findOne({ userId: patientId });
    if (!patientObj) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      diagnosis,
      prescription: prescription || 'No prescription added',
      notes: notes || '',
      relatedDocuments: relatedDocuments || [],
    });

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone');

    res.status(201).json({ success: true, data: populatedRecord });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medical records filtered by role
// @route   GET /api/medical-records
// @access  Private
exports.getMedicalRecords = async (req, res, next) => {
  try {
    let query = {};
    const { patientId } = req.query;

    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      if (patientId) {
        query.patientId = patientId;
      }
      // Doctors can see all or filter by patient
    }

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone')
      .sort({ recordDate: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
exports.getMedicalRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email phone');

    if (!record) {
      res.status(404);
      throw new Error('Medical record not found');
    }

    // Authority checks
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'doctor' &&
      record.patientId._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to access this medical record');
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
