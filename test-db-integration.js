const axios = require('axios');

// Service URLs
const USERS_SERVICE = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
const PRODUCTS_SERVICE = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002';
const ORDERS_SERVICE = process.env.ORDERS_SERVICE_URL || 'http://localhost:3003';

// Test functions
async function testUsersService() {
  console.log('\n=== Testing Users Service ===');
  try {
    // Seed users
    console.log('Seeding users...');
    await axios.post(`${USERS_SERVICE}/seed`);
    
    // Get all users
    console.log('Getting all users...');
    const usersResponse = await axios.get(USERS_SERVICE);
    console.log(`Found ${usersResponse.data.length} users`);
    
    // Create a new user
    console.log('Creating a new user...');
    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer'
    };
    const createResponse = await axios.post(USERS_SERVICE, newUser);
    console.log(`Created user with ID: ${createResponse.data._id}`);
    
    // Get user by ID
    console.log('Getting user by ID...');
    const userResponse = await axios.get(`${USERS_SERVICE}/${createResponse.data._id}`);
    console.log(`Found user: ${userResponse.data.name}`);
    
    // Update user
    console.log('Updating user...');
    const updateResponse = await axios.put(`${USERS_SERVICE}/${createResponse.data._id}`, {
      name: 'Updated Test User'
    });
    console.log(`Updated user name to: ${updateResponse.data.name}`);
    
    // Delete user
    console.log('Deleting user...');
    await axios.delete(`${USERS_SERVICE}/${createResponse.data._id}`);
    console.log('User deleted successfully');
    
    console.log('✅ Users Service tests passed');
    return true;
  } catch (error) {
    console.error('❌ Users Service test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testProductsService() {
  console.log('\n=== Testing Products Service ===');
  try {
    // Seed products
    console.log('Seeding products...');
    await axios.post(`${PRODUCTS_SERVICE}/seed`);
    
    // Get all products
    console.log('Getting all products...');
    const productsResponse = await axios.get(PRODUCTS_SERVICE);
    console.log(`Found ${productsResponse.data.length} products`);
    
    // Create a new product
    console.log('Creating a new product...');
    const newProduct = {
      name: 'Test Product',
      description: 'A test product',
      price: 99.99,
      stock: 50,
      category: 'test'
    };
    const createResponse = await axios.post(PRODUCTS_SERVICE, newProduct);
    console.log(`Created product with ID: ${createResponse.data._id}`);
    
    // Get product by ID
    console.log('Getting product by ID...');
    const productResponse = await axios.get(`${PRODUCTS_SERVICE}/${createResponse.data._id}`);
    console.log(`Found product: ${productResponse.data.name}`);
    
    // Update product
    console.log('Updating product...');
    const updateResponse = await axios.put(`${PRODUCTS_SERVICE}/${createResponse.data._id}`, {
      price: 89.99,
      stock: 45
    });
    console.log(`Updated product price to: ${updateResponse.data.price}`);
    
    // Delete product
    console.log('Deleting product...');
    await axios.delete(`${PRODUCTS_SERVICE}/${createResponse.data._id}`);
    console.log('Product deleted successfully');
    
    console.log('✅ Products Service tests passed');
    return true;
  } catch (error) {
    console.error('❌ Products Service test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testOrdersService() {
  console.log('\n=== Testing Orders Service ===');
  try {
    // Seed orders
    console.log('Seeding orders...');
    await axios.post(`${ORDERS_SERVICE}/seed`);
    
    // Get all orders
    console.log('Getting all orders...');
    const ordersResponse = await axios.get(ORDERS_SERVICE);
    console.log(`Found ${ordersResponse.data.length} orders`);
    
    // Create a new order
    console.log('Creating a new order...');
    
    // First, ensure we have users and products
    await axios.post(`${USERS_SERVICE}/seed`);
    await axios.post(`${PRODUCTS_SERVICE}/seed`);
    
    const newOrder = {
      userId: 1,
      products: [
        { productId: 1, quantity: 1 }
      ]
    };
    
    const createResponse = await axios.post(ORDERS_SERVICE, newOrder);
    console.log(`Created order with ID: ${createResponse.data.id}`);
    
    // Get order by ID
    console.log('Getting order by ID...');
    const orderResponse = await axios.get(`${ORDERS_SERVICE}/${createResponse.data.id}`);
    console.log(`Found order with total: ${orderResponse.data.totalAmount}`);
    
    // Update order status
    console.log('Updating order status...');
    const updateResponse = await axios.patch(`${ORDERS_SERVICE}/${createResponse.data.id}/status`, {
      status: 'shipped'
    });
    console.log(`Updated order status to: ${updateResponse.data.status}`);
    
    // Delete order
    console.log('Deleting order...');
    await axios.delete(`${ORDERS_SERVICE}/${createResponse.data.id}`);
    console.log('Order deleted successfully');
    
    console.log('✅ Orders Service tests passed');
    return true;
  } catch (error) {
    console.error('❌ Orders Service test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting database integration tests...');
  
  const usersResult = await testUsersService();
  const productsResult = await testProductsService();
  const ordersResult = await testOrdersService();
  
  console.log('\n=== Test Results Summary ===');
  console.log(`Users Service: ${usersResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Products Service: ${productsResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Orders Service: ${ordersResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (usersResult && productsResult && ordersResult) {
    console.log('\n🎉 All database integration tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Please check the logs above for details.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});
