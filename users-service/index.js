const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rabbitmq = require('./rabbitmq');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// RabbitMQ setup
let rabbitChannel;

async function setupRabbitMQ() {
  try {
    const { channel } = await rabbitmq.connect();
    rabbitChannel = channel;
    
    // Setup exchange for user events
    await channel.assertExchange('user_events', 'topic', { durable: true });
    
    console.log('RabbitMQ setup completed');
  } catch (error) {
    console.error('Failed to setup RabbitMQ:', error);
    // Retry after delay
    setTimeout(setupRabbitMQ, 5000);
  }
}

// Initialize RabbitMQ
setupRabbitMQ();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Users Service is healthy' });
});

// Get all users
app.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
app.post('/', async (req, res) => {
  try {
    const { name, email, role = 'customer' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Create new user
    const newUser = await User.create({
      name,
      email,
      role
    });
    
    // Publish user created event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'user_events',
          'user.created',
          { user: newUser.toObject() }
        );
      } catch (error) {
        console.error('Failed to publish user created event:', error);
      }
    }
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
app.put('/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Find and update user
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    
    await user.save();
    
    // Publish user updated event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'user_events',
          'user.updated',
          { user: user.toObject() }
        );
      } catch (error) {
        console.error('Failed to publish user updated event:', error);
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userId = user._id;
    
    // Delete the user
    await User.deleteOne({ _id: userId });
    
    // Publish user deleted event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'user_events',
          'user.deleted',
          { userId: userId.toString() }
        );
      } catch (error) {
        console.error('Failed to publish user deleted event:', error);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Data seeding endpoint (for demo purposes)
app.post('/seed', async (req, res) => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Create seed data
    const seedUsers = [
      { name: 'John Doe', email: 'john@example.com', role: 'customer' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'customer' },
      { name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { name: 'Sarah Johnson', email: 'sarah@example.com', role: 'customer' },
      { name: 'Michael Brown', email: 'michael@example.com', role: 'customer' }
    ];
    
    const users = await User.insertMany(seedUsers);
    
    res.status(200).json({ message: 'User data seeded successfully', users });
  } catch (error) {
    console.error('Error seeding users:', error);
    res.status(500).json({ error: 'Failed to seed users' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Users Service running on port ${PORT}`);
});
