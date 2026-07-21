// ============================================
// የዳታቤዝ ውቅረት - MongoDB ግንኙነት
// ============================================
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // MONGO_URI በ .env ፋይል ውስጥ መኖሩን ያረጋግጣል
  if (!mongoUri) {
    console.error('❌ MONGO_URI በ .env ፋይል ውስጥ አልተገኘም!');
    process.exit(1);
  }

  try {
    // ከ Atlas ጋር ለመገናኘት መሞከር
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB ተገናኝቷል: ${conn.connection.host}`);
  } catch (error) {
    // ግንኙነቱ ካልተሳካ ስህተቱን ያሳያል እና ፕሮግራሙን ያቆማል
    console.error(`❌ የ MongoDB ግንኙነት ስህተት: ${error.message}`);
    process.exit(1);
  }
};

// የግንኙነት ሁኔታዎችን መከታተል
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB ተቋርጧል');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB እንደገና ተገናኝቷል');
});

module.exports = connectDB;