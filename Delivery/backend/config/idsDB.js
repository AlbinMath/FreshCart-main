const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const idsDB = mongoose.createConnection(process.env.MONGODB_URI_IDS);

idsDB.on('connected', () => {
    console.log('Connected to MongoDB (IDS Database)');
});

idsDB.on('error', (err) => {
    console.error('MongoDB (IDS Database) connection error:', err);
});

module.exports = idsDB;
