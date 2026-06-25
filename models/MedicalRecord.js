const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema(
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
    diagnosis: {
      type: String,
      required: [true, 'Please add a diagnosis'],
    },
    prescription: {
      type: String,
      default: 'No prescription added',
    },
    notes: {
      type: String,
      default: '',
    },
    relatedDocuments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: String, default: '1.2 MB' },
      },
    ],
    recordDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
