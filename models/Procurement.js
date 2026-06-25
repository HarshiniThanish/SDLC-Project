const mongoose = require('mongoose');

const ProcurementSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    itemsProvided: {
      type: Number,
      required: true,
    },
    totalSpend: {
      type: Number,
      required: true,
    },
    leadTimeScore: {
      type: String,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Procurement', ProcurementSchema);
