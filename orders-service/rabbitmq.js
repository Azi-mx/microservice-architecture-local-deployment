const amqp = require('amqplib');

// RabbitMQ connection URL
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

// Connect to RabbitMQ
async function connect() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error.message);
    // Retry connection after delay
    console.log('Retrying connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connect();
  }
}

// Publish message to a queue
async function publishToQueue(channel, queueName, message) {
  try {
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
    console.log(`Message sent to queue ${queueName}`);
  } catch (error) {
    console.error(`Error publishing to queue ${queueName}:`, error.message);
  }
}

// Publish message to an exchange
async function publishToExchange(channel, exchangeName, routingKey, message) {
  try {
    await channel.assertExchange(exchangeName, 'topic', { durable: true });
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
    console.log(`Message published to exchange ${exchangeName} with routing key ${routingKey}`);
  } catch (error) {
    console.error(`Error publishing to exchange ${exchangeName}:`, error.message);
  }
}

// Consume messages from a queue
async function consumeFromQueue(channel, queueName, callback) {
  try {
    await channel.assertQueue(queueName, { durable: true });
    console.log(`Waiting for messages from queue ${queueName}`);
    
    channel.consume(queueName, (message) => {
      if (message) {
        const content = JSON.parse(message.content.toString());
        callback(content);
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error(`Error consuming from queue ${queueName}:`, error.message);
  }
}

// Subscribe to an exchange with a routing pattern
async function subscribeToExchange(channel, exchangeName, pattern, queueName, callback) {
  try {
    await channel.assertExchange(exchangeName, 'topic', { durable: true });
    const q = await channel.assertQueue(queueName || '', { exclusive: !queueName });
    
    await channel.bindQueue(q.queue, exchangeName, pattern);
    console.log(`Subscribed to exchange ${exchangeName} with pattern ${pattern}`);
    
    channel.consume(q.queue, (message) => {
      if (message) {
        const content = JSON.parse(message.content.toString());
        callback(content, message.fields.routingKey);
        channel.ack(message);
      }
    });
  } catch (error) {
    console.error(`Error subscribing to exchange ${exchangeName}:`, error.message);
  }
}

module.exports = {
  connect,
  publishToQueue,
  publishToExchange,
  consumeFromQueue,
  subscribeToExchange
};
