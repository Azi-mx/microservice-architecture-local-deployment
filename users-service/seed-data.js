const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users_db';

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist in the database. Skipping seed.');
      await mongoose.disconnect();
      return;
    }
    
    // Sample users data
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'customer',
        createdAt: new Date('2025-09-01T10:00:00'),
        updatedAt: new Date('2025-09-01T10:00:00')
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'customer',
        createdAt: new Date('2025-09-02T11:30:00'),
        updatedAt: new Date('2025-09-02T11:30:00')
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date('2025-09-03T09:15:00'),
        updatedAt: new Date('2025-09-03T09:15:00')
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        role: 'customer',
        createdAt: new Date('2025-09-04T14:45:00'),
        updatedAt: new Date('2025-09-04T14:45:00')
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        role: 'customer',
        createdAt: new Date('2025-09-05T16:20:00'),
        updatedAt: new Date('2025-09-05T16:20:00')
      }
    ];
    
    // Insert users
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log(`${insertedUsers.length} users have been successfully added to the database.`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedUsers();
