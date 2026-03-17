const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Administrator = require('../models/Administrator');
const Seller = require('../models/Seller');
const Deliveryagent = require('../models/Deliveryagent');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample data




async function initDB() {
  try {
    // Clear existing data
    await Admin.deleteMany({});
    await Administrator.deleteMany({});
    await Seller.deleteMany({});
    await Deliveryagent.deleteMany({});

    console.log('Existing data cleared');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);

    // Create sample admins with hashed passwords
    for (let admin of sampleAdmins) {
      admin.password = await bcrypt.hash(admin.password, salt);
      await Admin.create(admin);
    }

    // Create sample administrators with hashed passwords
    for (let administrator of sampleAdministrators) {
      administrator.password = await bcrypt.hash(administrator.password, salt);
      await Administrator.create(administrator);
    }

    // Create sample sellers
    for (let seller of sampleSellers) {
      seller.passwordHash = await bcrypt.hash('seller123', salt);
      await Seller.create(seller);
    }

    // Create sample delivery agents
    for (let agent of sampleDeliveryAgents) {
      agent.passwordHash = await bcrypt.hash('agent123', salt);
      await Deliveryagent.create(agent);
    }

    console.log('Sample data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initDB();