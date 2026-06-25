const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: [true, 'Please add an age'],
    },
    address: {
      type: String,
      trim: true,
    },
    insuranceProvider: {
      type: String,
      trim: true,
      default: 'None',
    },
    policyHolder: {
      type: String,
      trim: true,
      default: 'Self',
    },
    medicalHistory: {
      type: String,
      trim: true,
      default: 'No chronic conditions reported.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Patient', PatientSchema);
