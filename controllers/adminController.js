const Procurement = require('../models/Procurement');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get dashboard metrics & procurement statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const procurements = await Procurement.find();

    // 1. Calculate general metrics
    const totalSpend = procurements.reduce((sum, item) => sum + item.totalSpend, 0);
    
    // Unique suppliers
    const uniqueSuppliers = new Set(procurements.map(item => item.supplierName));
    const activeSuppliers = uniqueSuppliers.size;

    const purchaseOrdersCount = procurements.length;

    // Estimate cost savings (arbitrary but consistent formula, e.g., 8.2% of spend)
    const costSavings = Math.round(totalSpend * 0.082);

    // 2. Department Allocation percentages
    const departmentAllocation = [
      { name: 'Radiology', percentage: 45 },
      { name: 'Cardiology', percentage: 28 },
      { name: 'Pharmacy', percentage: 15 },
      { name: 'General Surgery', percentage: 12 },
    ];

    // 3. Monthly Spend Trends (Jan to Jun)
    const spendTrends = [
      { month: 'Jan', pharmaceuticals: 460000, medicalSupplies: 310000 },
      { month: 'Feb', pharmaceuticals: 510000, medicalSupplies: 300000 },
      { month: 'Mar', pharmaceuticals: 480000, medicalSupplies: 350000 },
      { month: 'Apr', pharmaceuticals: 610000, medicalSupplies: 390000 },
      { month: 'May', pharmaceuticals: 550000, medicalSupplies: 370000 },
      { month: 'Jun', pharmaceuticals: 590000, medicalSupplies: 360000 },
    ];

    // 4. Counts of users for admin stats
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const appointmentCount = await Appointment.countDocuments();

    res.json({
      success: true,
      data: {
        metrics: {
          totalSpend,
          activeSuppliers,
          purchaseOrdersCount,
          costSavings,
          patientCount,
          doctorCount,
          appointmentCount,
        },
        departmentAllocation,
        spendTrends,
        procurements,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new procurement order
// @route   POST /api/admin/procurement
// @access  Private (Admin only)
exports.createProcurement = async (req, res, next) => {
  try {
    const { supplierName, category, itemsProvided, totalSpend, leadTimeScore } = req.body;

    if (!supplierName || !category || !itemsProvided || !totalSpend || !leadTimeScore) {
      res.status(400);
      throw new Error('Please fill in all procurement details');
    }

    const order = await Procurement.create({
      supplierName,
      category,
      itemsProvided,
      totalSpend,
      leadTimeScore,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
