const mongoose = require('mongoose');
const Product = require('./models/Product');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products_db';

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('Products already exist in the database. Skipping seed.');
      await mongoose.disconnect();
      return;
    }
    
    // Sample products data
    const sampleProducts = [
      {
        name: 'Premium Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 89.99,
        category: 'Electronics',
        stock: 50,
        createdAt: new Date('2025-09-01T10:00:00'),
        updatedAt: new Date('2025-09-01T10:00:00')
      },
      {
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad compatible with all devices',
        price: 40.00,
        category: 'Electronics',
        stock: 75,
        createdAt: new Date('2025-09-01T11:30:00'),
        updatedAt: new Date('2025-09-01T11:30:00')
      },
      {
        name: 'Smart Watch Band',
        description: 'Replacement band for smart watches, multiple colors',
        price: 25.50,
        category: 'Accessories',
        stock: 100,
        createdAt: new Date('2025-09-02T14:45:00'),
        updatedAt: new Date('2025-09-02T14:45:00')
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable waterproof speaker with 20-hour battery life',
        price: 60.00,
        category: 'Electronics',
        stock: 30,
        createdAt: new Date('2025-09-03T09:15:00'),
        updatedAt: new Date('2025-09-03T09:15:00')
      },
      {
        name: 'Laptop Stand',
        description: 'Adjustable ergonomic stand for laptops and tablets',
        price: 35.25,
        category: 'Office',
        stock: 45,
        createdAt: new Date('2025-09-04T16:20:00'),
        updatedAt: new Date('2025-09-04T16:20:00')
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with customizable keys',
        price: 125.50,
        category: 'Computer Peripherals',
        stock: 25,
        createdAt: new Date('2025-09-05T13:10:00'),
        updatedAt: new Date('2025-09-05T13:10:00')
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with long battery life',
        price: 50.00,
        category: 'Computer Peripherals',
        stock: 60,
        createdAt: new Date('2025-09-06T10:30:00'),
        updatedAt: new Date('2025-09-06T10:30:00')
      }
    ];
    
    // Insert products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`${insertedProducts.length} products have been successfully added to the database.`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

// Run the seed function
seedProducts();
