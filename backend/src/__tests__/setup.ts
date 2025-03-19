import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Global MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Set up an in-memory MongoDB server for all tests
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to the in-memory MongoDB server
  await mongoose.connect(uri);
  console.log('Connected to the in-memory MongoDB server');
});

// Clean up after all tests
afterAll(async () => {
  // Disconnect from the in-memory MongoDB server
  await mongoose.disconnect();
  
  // Stop the in-memory MongoDB server
  await mongoServer.stop();
  console.log('Disconnected from the in-memory MongoDB server');
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}); 