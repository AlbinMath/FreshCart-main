const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const deliveryAgentDB = mongoose.createConnection(process.env.MONGODB_URI_Deliveryagent);

deliveryAgentDB.on('connected', () => {
    console.log('Connected to MongoDB (DeliveryAgent)');
});

deliveryAgentDB.on('error', (err) => {
    console.error('MongoDB (DeliveryAgent) connection error:', err);
});

module.exports = deliveryAgentDB;
