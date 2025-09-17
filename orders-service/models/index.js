const { Sequelize } = require('sequelize');

// Get database connection string from environment variable
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres-orders:5432/orders_db';

// Create Sequelize instance
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Import models
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);

// Define relationships
Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Order,
  OrderItem
};
