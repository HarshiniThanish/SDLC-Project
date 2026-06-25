const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Get all doctors with filters
// @route   GET /api/doctors
// @access  Public or Private
exports.getDoctors = async (req, res, next) => {
  try {
    const { department, specialization, search } = req.query;
    let query = {};

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Handle search parameter across doctor name and specialization
    if (search) {
      // Find matching users first
      const users = await User.find({
        role: 'doctor',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
      const userIds = users.map((u) => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { department: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await Doctor.find(query).populate('userId', 'name email phone');
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public or Private
exports.getDoctorById = async (req, res, next) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.params.id }).populate('userId', 'name email phone');
    
    if (!doctor) {
      doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone');
    }

    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found');
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor available slots
// @route   PUT /api/doctors/:id/slots
// @access  Private (Doctor/Admin)
exports.updateDoctorSlots = async (req, res, next) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.params.id });

    if (!doctor) {
      doctor = await Doctor.findById(req.params.id);
    }

    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found');
    }

    // Ensure users can only update their own slots unless admin
    if (req.user.role === 'doctor' && req.user.id !== doctor.userId.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this doctor slots');
    }

    const { availableSlots } = req.body;
    if (!Array.isArray(availableSlots)) {
      res.status(400);
      throw new Error('availableSlots must be an array');
    }

    doctor.availableSlots = availableSlots;
    await doctor.save();

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};
