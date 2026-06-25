const mongoose = require('mongoose');

// Configure test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caresync_test';
process.env.JWT_SECRET = 'testsecretkey123_token';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (err) {
      console.error('Test db connection failed:', err);
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
});
