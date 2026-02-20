const mongoose = require('mongoose');
require('dotenv').config();

// Using the same Users DB URI as other services for Ledger consistency
// In a real microservice, this might be a separate DB, but for this Hackathon/MVP:
// All ledgers live in Users DB.
const MONGODB_URI_USERS = process.env.MONGODB_URI_USERS || "mongodb+srv://albinmathewtomo:albinmathewtomo@registrations.jj9mvgr.mongodb.net/Users?appName=Registrations";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI_USERS);
        console.log('MongoDB (Users) Connected for Tax Service');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
