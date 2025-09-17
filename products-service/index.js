const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rabbitmq = require('./rabbitmq');
const Product = require('./models/Product');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products_db';

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
    
    // Setup exchange for product events
    await channel.assertExchange('product_events', 'topic', { durable: true });
    
    // Setup exchange for inventory updates
    await channel.assertExchange('inventory_events', 'topic', { durable: true });
    
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
  res.json({ status: 'Products Service is healthy' });
});

// Get all products
app.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
app.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
app.post('/', async (req, res) => {
  try {
    const { name, price, stock = 0, category, description = '' } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Create new product
    const newProduct = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category
    });
    
    // Publish product created event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'product_events',
          'product.created',
          { product: newProduct.toObject() }
        );
      } catch (error) {
        console.error('Failed to publish product created event:', error);
      }
    }
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/:id', async (req, res) => {
  try {
    const { name, price, stock, category, description } = req.body;
    
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // Track if stock was updated
    const stockUpdated = stock !== undefined && product.stock !== parseInt(stock);
    const oldStock = product.stock;
    
    // Update fields
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock);
    if (category) product.category = category;
    if (description) product.description = description;
    
    await product.save();
    
    // Publish product updated event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'product_events',
          'product.updated',
          { product: product.toObject() }
        );
        
        // If stock was updated, publish inventory update event
        if (stockUpdated) {
          await rabbitmq.publishToExchange(
            rabbitChannel,
            'inventory_events',
            'inventory.updated',
            { 
              productId: product._id.toString(), 
              stock: product.stock,
              previousStock: oldStock 
            }
          );
        }
      } catch (error) {
        console.error('Failed to publish product updated event:', error);
      }
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const productId = product._id;
    const productName = product.name;
    
    // Delete the product
    await Product.deleteOne({ _id: productId });
    
    // Publish product deleted event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'product_events',
          'product.deleted',
          { productId: productId.toString(), productName: productName }
        );
      } catch (error) {
        console.error('Failed to publish product deleted event:', error);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get products by category
app.get('/category/:category', async (req, res) => {
  try {
    const categoryProducts = await Product.find({ category: req.params.category });
    res.json(categoryProducts);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});

// Data seeding endpoint (for demo purposes)
app.post('/seed', async (req, res) => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    
    // Create seed data
    const seedProducts = [
      { name: 'Laptop', description: 'High-performance laptop', price: 999.99, stock: 10, category: 'electronics' },
      { name: 'Smartphone', description: 'Latest model smartphone', price: 699.99, stock: 25, category: 'electronics' },
      { name: 'Headphones', description: 'Noise-cancelling headphones', price: 199.99, stock: 50, category: 'electronics' },
      { name: 'Coffee Maker', description: 'Automatic coffee maker', price: 89.99, stock: 15, category: 'home' },
      { name: 'Running Shoes', description: 'Comfortable running shoes', price: 129.99, stock: 30, category: 'sports' },
      { name: 'Bluetooth Speaker', description: 'Portable bluetooth speaker', price: 59.99, stock: 20, category: 'electronics' },
      { name: 'Yoga Mat', description: 'Non-slip yoga mat', price: 29.99, stock: 40, category: 'sports' },
      { name: 'Desk Lamp', description: 'Adjustable desk lamp', price: 24.99, stock: 35, category: 'home' }
    ];
    
    const products = await Product.insertMany(seedProducts);
    
    res.status(200).json({ message: 'Product data seeded successfully', products });
  } catch (error) {
    console.error('Error seeding products:', error);
    res.status(500).json({ error: 'Failed to seed products' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Products Service running on port ${PORT}`);
});
