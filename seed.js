const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const Procurement = require('./models/Procurement');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caresync');
    console.log('Seeder connected to database...');

    // Clear existing data
    await User.deleteMany();
    await Patient.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();
    await MedicalRecord.deleteMany();
    await Procurement.deleteMany();
    console.log('Database cleared of existing records.');

    // 1. Create Admins
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@caresync.com',
      password: 'password123',
      phone: '(555) 123-9999',
      role: 'admin',
    });
    console.log('Admin user created (admin@caresync.com / password123)');

    // 2. Create Patient Accounts
    const patient1User = await User.create({
      name: 'Alex Johnson',
      email: 'alex.johnson@caresync.com',
      password: 'password123',
      phone: '(555) 345-6789',
      role: 'patient',
    });

    const patient1Profile = await Patient.create({
      userId: patient1User._id,
      age: 34,
      address: '123 Main St, New York NY 10001',
      insuranceProvider: 'BlueCross PPO',
      policyHolder: 'Alex Johnson',
      medicalHistory: 'Mild asthma, seasonal allergies. Otherwise healthy.',
    });

    const patient2User = await User.create({
      name: 'Jane Doe',
      email: 'patient@caresync.com',
      password: 'password123',
      phone: '(555) 987-6543',
      role: 'patient',
    });

    await Patient.create({
      userId: patient2User._id,
      age: 28,
      address: '456 Oak Lane, Brooklyn NY 11201',
      insuranceProvider: 'None',
      policyHolder: 'Self',
      medicalHistory: 'No chronic conditions reported. Regular clinical checkups.',
    });
    console.log('Patient users created');

    // 3. Create Doctors
    const doc1User = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@caresync.com',
      password: 'password123',
      phone: '(555) 123-4567',
      role: 'doctor',
    });
    await Doctor.create({
      userId: doc1User._id,
      department: 'Cardiology',
      specialization: 'Senior Cardiologist',
      rating: 4.9,
      availableSlots: ['09:00 AM', '10:30 AM', '02:15 PM', '04:00 PM'],
    });

    const doc2User = await User.create({
      name: 'Dr. Michael Chen',
      email: 'michael.chen@caresync.com',
      password: 'password123',
      phone: '(555) 987-1234',
      role: 'doctor',
    });
    await Doctor.create({
      userId: doc2User._id,
      department: 'Dermatology',
      specialization: 'Dermatologist',
      rating: 4.8,
      availableSlots: ['08:15 AM', '11:00 AM', '01:30 PM', '03:45 PM'],
    });

    const doc3User = await User.create({
      name: 'Dr. Elena Rodriguez',
      email: 'elena.rodriguez@caresync.com',
      password: 'password123',
      phone: '(555) 789-0123',
      role: 'doctor',
    });
    await Doctor.create({
      userId: doc3User._id,
      department: 'Cardiology', // Senior Cardiologist in detail view
      specialization: 'Senior Cardiologist',
      rating: 5.0,
      availableSlots: ['10:00 AM', '11:30 AM', '03:00 PM', '05:15 PM'],
    });

    const doc4User = await User.create({
      name: 'Dr. James Wilson',
      email: 'james.wilson@caresync.com',
      password: 'password123',
      phone: '(555) 456-7890',
      role: 'doctor',
    });
    await Doctor.create({
      userId: doc4User._id,
      department: 'Orthopedics',
      specialization: 'Orthopedic Surgeon',
      rating: 4.7,
      availableSlots: ['07:30 AM', '09:45 AM', '12:00 PM', '02:30 PM'],
    });
    console.log('Doctor users created (password123 for all)');

    // 4. Create Appointments
    // Scheduled Appointment
    const appt1 = await Appointment.create({
      patientId: patient1User._id,
      doctorId: doc3User._id, // Elena Rodriguez
      appointmentDate: new Date('2026-11-12'),
      appointmentTime: '10:30 AM',
      symptoms: 'Annual cardiovascular checkup and prescription renewal. Patient requesting stress test verification.',
      status: 'Scheduled',
      copay: 15.00, // BlueCross PPO
      notes: 'Please arrive 15 minutes early for check-in paperwork. Fast for at least 8 hours prior to the appointment for blood work. Bring current medication list and insurance card.',
      history: [
        {
          action: 'Booking initiated via mobile application.',
          performedBy: 'Alex Johnson',
          timestamp: new Date('2026-10-27T10:45:00Z'),
        },
        {
          action: 'Verification successful with Aetna Insurance.',
          performedBy: 'CareSync Auto-System',
          timestamp: new Date('2026-10-28T14:15:00Z'),
        },
      ],
    });

    // Completed Appointment
    await Appointment.create({
      patientId: patient1User._id,
      doctorId: doc1User._id,
      appointmentDate: new Date('2026-06-15'),
      appointmentTime: '02:15 PM',
      symptoms: 'General fatigue and lightheadedness during exercises.',
      status: 'Completed',
      copay: 15.00,
      notes: 'Recommended blood work panel. Follow up next week.',
      history: [
        {
          action: 'Appointment Scheduled',
          performedBy: 'Alex Johnson',
          timestamp: new Date('2026-06-01T09:00:00Z'),
        },
        {
          action: 'Status updated to Completed',
          performedBy: 'Dr. Sarah Jenkins',
          timestamp: new Date('2026-06-15T15:00:00Z'),
        },
      ],
    });

    // Cancelled Appointment
    await Appointment.create({
      patientId: patient2User._id,
      doctorId: doc2User._id,
      appointmentDate: new Date('2026-06-20'),
      appointmentTime: '11:00 AM',
      symptoms: 'Skin rash on upper arm.',
      status: 'Cancelled',
      copay: 25.00,
      notes: 'Patient cancelled due to conflict.',
      history: [
        {
          action: 'Appointment Scheduled',
          performedBy: 'Jane Doe',
          timestamp: new Date('2026-06-10T14:00:00Z'),
        },
        {
          action: 'Status updated to Cancelled',
          performedBy: 'Jane Doe',
          timestamp: new Date('2026-06-18T10:00:00Z'),
        },
      ],
    });
    console.log('Mock appointments seeded.');

    // 5. Create Medical Records
    await MedicalRecord.create({
      patientId: patient1User._id,
      doctorId: doc3User._id,
      diagnosis: 'Essential Hypertension (primary)',
      prescription: 'Lisinopril 10mg - Take 1 tablet by mouth daily in the morning.',
      notes: 'Patient exhibits blood pressure reading of 135/85. Recommended reducing sodium intake and regular cardio. Next checkup scheduled in 6 months.',
      relatedDocuments: [
        {
          name: 'Previous_Lab_Results_Oct.pdf',
          url: '#',
          size: '1.2 MB',
        },
        {
          name: 'Insurance_Verification.png',
          url: '#',
          size: '850 KB',
        },
      ],
      recordDate: new Date('2026-05-10'),
    });
    console.log('Medical records seeded.');

    // 6. Create Procurement Data
    const procurements = [
      {
        supplierName: 'Global Pharma Corp',
        category: 'Medications',
        itemsProvided: 142,
        totalSpend: 124500,
        leadTimeScore: '98%',
        orderDate: new Date('2026-06-12'),
      },
      {
        supplierName: 'MediSupply Co.',
        category: 'Surgical Gear',
        itemsProvided: 85,
        totalSpend: 45200,
        leadTimeScore: '92%',
        orderDate: new Date('2026-06-14'),
      },
      {
        supplierName: 'Stark Medical',
        category: 'Lab Equipment',
        itemsProvided: 12,
        totalSpend: 89000,
        leadTimeScore: '85%',
        orderDate: new Date('2026-06-15'),
      },
      {
        supplierName: 'BioCare Solutions',
        category: 'Vaccines',
        itemsProvided: 56,
        totalSpend: 312000,
        leadTimeScore: '96%',
        orderDate: new Date('2026-06-15'),
      },
      {
        supplierName: 'HealthTech Inc.',
        category: 'Maintenance',
        itemsProvided: 34,
        totalSpend: 12800,
        leadTimeScore: '89%',
        orderDate: new Date('2026-06-15'),
      },
    ];

    await Procurement.create(procurements);
    console.log('Procurement reports seeded.');

    console.log('All seeding actions completed successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
