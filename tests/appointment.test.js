require('./setup');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');


describe('Appointment Booking API Endpoints', () => {
  let patientToken;
  let doctorId;
  let patientId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});

    // 1. Create Patient
    const registerPatientRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient Test',
        email: 'patient.test@test.com',
        password: 'password123',
        phone: '555',
        role: 'patient',
        age: 25,
      });
    patientToken = registerPatientRes.body.token;
    patientId = registerPatientRes.body.user._id;

    // 2. Create Doctor
    const registerDoctorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doctor Test',
        email: 'doctor.test@test.com',
        password: 'password123',
        phone: '555',
        role: 'doctor',
        department: 'Cardiology',
        specialization: 'Cardiologist',
      });
    doctorId = registerDoctorRes.body.user._id;
  });

  test('POST /api/appointments - Should schedule a new appointment', async () => {
    // Schedule tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId,
        appointmentDate: tomorrowStr,
        appointmentTime: '10:30 AM',
        symptoms: 'Mild chest pressure',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentTime).toBe('10:30 AM');
    expect(res.body.data.status).toBe('Scheduled');
  });

  test('POST /api/appointments - Should prevent double-booking identical slot', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Book first
    await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId,
        appointmentDate: tomorrowStr,
        appointmentTime: '10:30 AM',
        symptoms: 'First booking symptoms',
      });

    // Try booking second time
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId,
        appointmentDate: tomorrowStr,
        appointmentTime: '10:30 AM',
        symptoms: 'Double booking symptoms',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
