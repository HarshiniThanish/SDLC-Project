const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Please add a specialization'],
      trim: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    availableSlots: {
      type: [String],
      default: ['09:00 AM', '10:30 AM', '02:15 PM', '04:00 PM'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Doctor', DoctorSchema);
