require('./setup');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');


describe('Authentication API Endpoints', () => {
  
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('POST /api/auth/register - Should register a new patient user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john.doe@test.com',
        password: 'password123',
        phone: '(555) 123-4567',
        role: 'patient',
        age: 30,
        address: '123 Main St',
        insuranceProvider: 'BlueCross',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('john.doe@test.com');
  });

  test('POST /api/auth/login - Should authenticate user and return token', async () => {
    // Pre-create user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane.doe@test.com',
        password: 'password123',
        phone: '(555) 987-6543',
        role: 'patient',
        age: 28,
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane.doe@test.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe('Jane Doe');
  });

  test('GET /api/auth/me - Should return 401 when request lacks authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
