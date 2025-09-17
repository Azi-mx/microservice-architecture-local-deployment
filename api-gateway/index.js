const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rabbitmq = require('./rabbitmq');

const app = express();
app.use(express.json());
app.use(cors());

// Service URLs from environment variables
const USERS_SERVICE = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
const PRODUCTS_SERVICE = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002';
const ORDERS_SERVICE = process.env.ORDERS_SERVICE_URL || 'http://localhost:3003';

// RabbitMQ setup
let rabbitChannel;

async function setupRabbitMQ() {
  try {
    const { channel } = await rabbitmq.connect();
    rabbitChannel = channel;
    
    // Setup exchange for gateway events
    await channel.assertExchange('gateway_events', 'topic', { durable: true });
    
    // Subscribe to all service events for logging and potential cross-service actions
    await rabbitmq.subscribeToExchange(
      channel,
      'user_events',
      'user.#',
      'gateway-user-events',
      handleUserEvent
    );
    
    await rabbitmq.subscribeToExchange(
      channel,
      'product_events',
      'product.#',
      'gateway-product-events',
      handleProductEvent
    );
    
    await rabbitmq.subscribeToExchange(
      channel,
      'order_events',
      'order.#',
      'gateway-order-events',
      handleOrderEvent
    );
    
    console.log('RabbitMQ setup completed in API Gateway');
  } catch (error) {
    console.error('Failed to setup RabbitMQ in API Gateway:', error);
    // Retry after delay
    setTimeout(setupRabbitMQ, 5000);
  }
}

// Event handlers for different service events
function handleUserEvent(data, routingKey) {
  console.log(`[Gateway] Received user event: ${routingKey}`, data);
  // Could implement notifications, logging, or cross-service coordination
}

function handleProductEvent(data, routingKey) {
  console.log(`[Gateway] Received product event: ${routingKey}`, data);
  // Could implement inventory alerts, etc.
}

function handleOrderEvent(data, routingKey) {
  console.log(`[Gateway] Received order event: ${routingKey}`, data);
  // Could implement order notifications, etc.
}

// Initialize RabbitMQ
setupRabbitMQ();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is healthy' });
});

// CI/CD test endpoint - Added to test GitHub Actions pipeline
app.get('/cicd-test', (req, res) => {
  const buildTime = new Date().toISOString();
  res.json({ 
    message: 'CI/CD pipeline is working!',
    buildTime: buildTime,
    kubernetes: process.env.KUBERNETES_SERVICE_HOST ? true : false,
    version: '1.0.1'
  });
});

// Service status endpoint
app.get('/status', async (req, res) => {
  try {
    const services = {};
    
    try {
      const usersResponse = await axios.get(`${USERS_SERVICE}/health`);
      services.users = { status: 'up', message: usersResponse.data.status };
    } catch (error) {
      services.users = { status: 'down', error: error.message };
    }
    
    try {
      const productsResponse = await axios.get(`${PRODUCTS_SERVICE}/health`);
      services.products = { status: 'up', message: productsResponse.data.status };
    } catch (error) {
      services.products = { status: 'down', error: error.message };
    }
    
    try {
      const ordersResponse = await axios.get(`${ORDERS_SERVICE}/health`);
      services.orders = { status: 'up', message: ordersResponse.data.status };
    } catch (error) {
      services.orders = { status: 'down', error: error.message };
    }
    
    res.json({
      gateway: { status: 'up' },
      rabbitmq: { status: rabbitChannel ? 'connected' : 'disconnected' },
      services
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking service status' });
  }
});

// Users Service Routes
app.use('/users', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${USERS_SERVICE}${req.url}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error forwarding request to Users Service'
    });
  }
});

// Products Service Routes
app.use('/products', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${PRODUCTS_SERVICE}${req.url}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error forwarding request to Products Service'
    });
  }
});

// Orders Service Routes
app.use('/orders', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${ORDERS_SERVICE}${req.url}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Error forwarding request to Orders Service'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
