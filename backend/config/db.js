// ============================================
// Database Configuration - MongoDB Connection
// ============================================
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // Checks if MONGO_URI exists in the .env file
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not found in the .env file!');
    process.exit(1);
  }

  try {
    // Attempting to connect to Atlas
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB isconnected: ${conn.connection.host}`);
  } catch (error) {
    // If the connection fails, it shows the error and stops the program
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Monitoring connection states
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected!');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB is reconnected!');
});

module.exports = connectDB;