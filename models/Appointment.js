const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    symptoms: {
      type: String,
      required: [true, 'Please add symptoms or reason for visit'],
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    copay: {
      type: Number,
      default: 25.00,
    },
    insuranceApproved: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
    history: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
