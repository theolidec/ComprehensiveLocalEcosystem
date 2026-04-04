const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', async () => {
  logger.info('Mongoose connected to MongoDB');
  
  // Clean up problematic indexes
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('wishlistitems');
    const indexes = await collection.indexes();
    
    // Drop user_1_productId_1 index if it exists
    const productIdIndex = indexes.find(idx => idx.name === 'user_1_productId_1');
    if (productIdIndex) {
      await collection.dropIndex('user_1_productId_1');
      logger.info('Dropped problematic user_1_productId_1 index from wishlistitems');
    }
  } catch (err) {
    // Index might not exist, which is fine
    if (err.code !== 27) { // 27 = index not found
      logger.warn('Error cleaning up indexes:', err.message);
    }
  }
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
