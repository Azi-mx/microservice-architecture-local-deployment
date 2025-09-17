const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const rabbitmq = require('./rabbitmq');
const prisma = require('./prisma/client');
const supabase = require('./supabase/client');

const app = express();
app.use(express.json());
app.use(cors());

// Service URLs from environment variables
const USERS_SERVICE = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
const PRODUCTS_SERVICE = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002';

// RabbitMQ setup
let rabbitChannel;

async function setupRabbitMQ() {
  try {
    const { channel } = await rabbitmq.connect();
    rabbitChannel = channel;
    
    // Setup exchange for order events
    await channel.assertExchange('order_events', 'topic', { durable: true });
    
    // Subscribe to product events
    await rabbitmq.subscribeToExchange(
      channel,
      'product_events',
      'product.#',
      'orders-product-events',
      handleProductEvent
    );
    
    // Subscribe to user events
    await rabbitmq.subscribeToExchange(
      channel,
      'user_events',
      'user.#',
      'orders-user-events',
      handleUserEvent
    );
    
    console.log('RabbitMQ setup completed');
  } catch (error) {
    console.error('Failed to setup RabbitMQ:', error);
    // Retry after delay
    setTimeout(setupRabbitMQ, 5000);
  }
}

// Handle product events
async function handleProductEvent(data, routingKey) {
  console.log(`Received product event: ${routingKey}`, data);
  
  // Handle product deleted event
  if (routingKey === 'product.deleted') {
    const { productId } = data;
    try {
      // Find orders with this product
      const affectedOrders = await prisma.orderItem.findMany({
        where: {
          productId: parseInt(productId),
          order: {
            status: {
              notIn: ['completed', 'cancelled']
            }
          }
        },
        include: {
          order: true
        }
      });
      
      // Mark orders as affected
      for (const item of affectedOrders) {
        await prisma.order.update({
          where: { id: item.orderId },
          data: {
            status: 'affected',
            statusNote: `Product ${data.productName} is no longer available`
          }
        });
      }
    } catch (error) {
      console.error('Error handling product deleted event:', error);
    }
  }
}

// Handle user events
async function handleUserEvent(data, routingKey) {
  console.log(`Received user event: ${routingKey}`, data);
  
  // Handle user deleted event
  if (routingKey === 'user.deleted') {
    const { userId } = data;
    try {
      // Mark orders for this user as affected
      await prisma.order.updateMany({
        where: {
          userId: parseInt(userId),
          status: {
            notIn: ['completed', 'cancelled']
          }
        },
        data: {
          status: 'affected',
          statusNote: 'User account has been deleted',
          userDeleted: true
        }
      });
    } catch (error) {
      console.error('Error handling user deleted event:', error);
    }
  }
}

// Initialize RabbitMQ
setupRabbitMQ();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Orders Service is healthy' });
});

// Add sample data if the database is empty
async function addSampleData() {
  try {
    // Check if we have any orders
    const { data: existingOrders, error: checkError } = await supabase
      .from('Order')
      .select('id')
      .limit(1);
    
    if (checkError) {
      if (checkError.code === 'PGRST205') {
        console.log('Tables do not exist. Please create them first.');
      } else {
        console.error('Error checking for existing orders:', checkError);
      }
      return;
    }
    
    // If we already have orders, don't add sample data
    if (existingOrders && existingOrders.length > 0) {
      console.log('Sample data already exists. Skipping...');
      return;
    }
    
    console.log('Adding sample data...');
    
    // Add sample orders
    const sampleOrders = [
      {
        userId: 1,
        totalAmount: 129.99,
        status: 'completed',
        createdAt: new Date('2025-09-10T10:30:00'),
        updatedAt: new Date('2025-09-10T10:30:00')
      },
      {
        userId: 2,
        totalAmount: 85.50,
        status: 'processing',
        createdAt: new Date('2025-09-12T14:45:00'),
        updatedAt: new Date('2025-09-12T14:45:00')
      },
      {
        userId: 1,
        totalAmount: 210.75,
        status: 'pending',
        createdAt: new Date('2025-09-14T09:15:00'),
        updatedAt: new Date('2025-09-14T09:15:00')
      }
    ];
    
    // Insert orders and get their IDs
    const { data: insertedOrders, error: orderError } = await supabase
      .from('Order')
      .insert(sampleOrders)
      .select();
      
    if (orderError) {
      console.error('Error inserting sample orders:', orderError);
      return;
    }
    
    console.log('Sample orders added:', insertedOrders.length);
    
    // Add sample order items
    const orderItems = [
      // Items for first order
      {
        orderId: insertedOrders[0].id,
        productId: 101,
        name: 'Premium Headphones',
        price: 89.99,
        quantity: 1,
        createdAt: new Date('2025-09-10T10:30:00'),
        updatedAt: new Date('2025-09-10T10:30:00')
      },
      {
        orderId: insertedOrders[0].id,
        productId: 203,
        name: 'Wireless Charger',
        price: 40.00,
        quantity: 1,
        createdAt: new Date('2025-09-10T10:30:00'),
        updatedAt: new Date('2025-09-10T10:30:00')
      },
      // Items for second order
      {
        orderId: insertedOrders[1].id,
        productId: 305,
        name: 'Smart Watch Band',
        price: 25.50,
        quantity: 1,
        createdAt: new Date('2025-09-12T14:45:00'),
        updatedAt: new Date('2025-09-12T14:45:00')
      },
      {
        orderId: insertedOrders[1].id,
        productId: 402,
        name: 'Bluetooth Speaker',
        price: 60.00,
        quantity: 1,
        createdAt: new Date('2025-09-12T14:45:00'),
        updatedAt: new Date('2025-09-12T14:45:00')
      },
      // Items for third order
      {
        orderId: insertedOrders[2].id,
        productId: 505,
        name: 'Laptop Stand',
        price: 35.25,
        quantity: 1,
        createdAt: new Date('2025-09-14T09:15:00'),
        updatedAt: new Date('2025-09-14T09:15:00')
      },
      {
        orderId: insertedOrders[2].id,
        productId: 601,
        name: 'Mechanical Keyboard',
        price: 125.50,
        quantity: 1,
        createdAt: new Date('2025-09-14T09:15:00'),
        updatedAt: new Date('2025-09-14T09:15:00')
      },
      {
        orderId: insertedOrders[2].id,
        productId: 702,
        name: 'Wireless Mouse',
        price: 50.00,
        quantity: 1,
        createdAt: new Date('2025-09-14T09:15:00'),
        updatedAt: new Date('2025-09-14T09:15:00')
      }
    ];
    
    const { data: insertedItems, error: itemError } = await supabase
      .from('OrderItem')
      .insert(orderItems)
      .select();
      
    if (itemError) {
      console.error('Error inserting sample order items:', itemError);
      return;
    }
    
    console.log('Sample order items added:', insertedItems.length);
    console.log('Sample data added successfully!');
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Initialize sample data
addSampleData();


// Get all orders
app.get('/', async (req, res) => {
  try {
    // Try with Prisma first
    try {
      const orders = await prisma.order.findMany({
        include: {
          items: true
        }
      });
      return res.json(orders);
    } catch (prismaError) {
      console.log('Prisma error, falling back to Supabase:', prismaError);
      
      // Fall back to Supabase if Prisma fails
      const { data: orders, error } = await supabase
        .from('Order')
        .select('*, items:OrderItem(*)');
      
      if (error && error.code === 'PGRST205') {
        // Table doesn't exist, return empty array
        return res.json([]);
      } else if (error) {
        throw error;
      }
      
      return res.json(orders || []);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
app.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Try with Prisma first
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true
        }
      });
      
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json(order);
    } catch (prismaError) {
      console.log('Prisma error, falling back to Supabase:', prismaError);
      
      // Fall back to Supabase if Prisma fails
      const { data: order, error } = await supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .eq('id', orderId)
        .single();
      
      if (error && error.code === 'PGRST205') {
        // Table doesn't exist
        return res.status(404).json({ error: 'Order not found' });
      } else if (error) {
        throw error;
      }
      
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json(order);
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get orders by user ID
app.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Try with Prisma first
    try {
      const userOrders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: true
        }
      });
      return res.json(userOrders);
    } catch (prismaError) {
      console.log('Prisma error, falling back to Supabase:', prismaError);
      
      // Fall back to Supabase if Prisma fails
      const { data: userOrders, error } = await supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .eq('userId', userId);
      
      if (error && error.code === 'PGRST205') {
        // Table doesn't exist, return empty array
        return res.json([]);
      } else if (error) {
        throw error;
      }
      
      return res.json(userOrders || []);
    }
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// Create new order
app.post('/', async (req, res) => {
  try {
    const { userId, products } = req.body;
    
    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'User ID and products array are required' });
    }
    
    // Verify user exists
    let user;
    try {
      const userResponse = await axios.get(`${USERS_SERVICE}/${userId}`);
      user = userResponse.data;
    } catch (error) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate total and verify products
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of products) {
      try {
        const productResponse = await axios.get(`${PRODUCTS_SERVICE}/${item.productId}`);
        const product = productResponse.data;
        
        if (item.quantity > product.stock) {
          return res.status(400).json({ 
            error: `Not enough stock for product ${product.name}. Available: ${product.stock}`
          });
        }
        
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        
        // Prepare order item
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          name: product.name,
          price: product.price
        });
        
        // Update product stock via RabbitMQ
        if (rabbitChannel) {
          await rabbitmq.publishToExchange(
            rabbitChannel,
            'inventory_events',
            'inventory.reserved',
            { 
              productId: product._id, 
              quantity: item.quantity
            }
          );
        } else {
          // Fallback to direct API call if RabbitMQ is not available
          await axios.put(`${PRODUCTS_SERVICE}/${item.productId}`, {
            stock: product.stock - item.quantity
          });
        }
      } catch (error) {
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }
    }
    
    // Create order in database
    const newOrder = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        totalAmount,
        status: 'processing',
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });
    
    // Publish order created event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'order_events',
          'order.created',
          { order: newOrder }
        );
      } catch (error) {
        console.error('Failed to publish order created event:', error);
      }
    }
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
app.patch('/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const oldStatus = order.status;
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true }
    });
    
    // Publish order status updated event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'order_events',
          'order.status_updated',
          { 
            orderId: order.id, 
            userId: order.userId,
            oldStatus,
            newStatus: status 
          }
        );
        
        // If order is completed, confirm inventory changes
        if (status === 'completed' && oldStatus !== 'completed') {
          for (const item of order.items) {
            await rabbitmq.publishToExchange(
              rabbitChannel,
              'inventory_events',
              'inventory.confirmed',
              { 
                productId: item.productId, 
                quantity: item.quantity,
                orderId: order.id
              }
            );
          }
        }
        
        // If order is cancelled, restore inventory
        if (status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'completed') {
          for (const item of order.items) {
            await rabbitmq.publishToExchange(
              rabbitChannel,
              'inventory_events',
              'inventory.restored',
              { 
                productId: item.productId, 
                quantity: item.quantity,
                orderId: order.id
              }
            );
          }
        }
      } catch (error) {
        console.error('Failed to publish order status updated event:', error);
      }
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete order
app.delete('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Delete order (Prisma will cascade delete items due to relation setup)
    await prisma.order.delete({
      where: { id: orderId }
    });
    
    // Publish order deleted event to RabbitMQ
    if (rabbitChannel) {
      try {
        await rabbitmq.publishToExchange(
          rabbitChannel,
          'order_events',
          'order.deleted',
          { 
            orderId: order.id, 
            userId: order.userId 
          }
        );
        
        // If order was not completed or cancelled, restore inventory
        if (order.status !== 'completed' && order.status !== 'cancelled') {
          for (const item of order.items) {
            await rabbitmq.publishToExchange(
              rabbitChannel,
              'inventory_events',
              'inventory.restored',
              { 
                productId: item.productId, 
                quantity: item.quantity,
                orderId: order.id
              }
            );
          }
        }
      } catch (error) {
        console.error('Failed to publish order deleted event:', error);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Data seeding endpoint (for demo purposes)
app.post('/seed', async (req, res) => {
  try {
    // Clear existing data
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    
    // Create seed data
    const seedOrders = [
      {
        userId: 1,
        totalAmount: 2199.97,
        status: 'completed',
        items: {
          create: [
            { productId: 1, quantity: 2, name: 'Laptop', price: 999.99 },
            { productId: 3, quantity: 1, name: 'Headphones', price: 199.99 }
          ]
        }
      },
      {
        userId: 2,
        totalAmount: 699.99,
        status: 'processing',
        items: {
          create: [
            { productId: 2, quantity: 1, name: 'Smartphone', price: 699.99 }
          ]
        }
      },
      {
        userId: 4,
        totalAmount: 189.97,
        status: 'shipped',
        items: {
          create: [
            { productId: 5, quantity: 1, name: 'Running Shoes', price: 129.99 },
            { productId: 7, quantity: 2, name: 'Yoga Mat', price: 29.99 }
          ]
        }
      }
    ];
    
    // Insert seed data
    const orders = [];
    for (const orderData of seedOrders) {
      const order = await prisma.order.create({
        data: orderData,
        include: { items: true }
      });
      orders.push(order);
    }
    
    res.status(200).json({ message: 'Order data seeded successfully', orders });
  } catch (error) {
    console.error('Error seeding orders:', error);
    res.status(500).json({ error: 'Failed to seed orders' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Orders Service running on port ${PORT}`);
});
