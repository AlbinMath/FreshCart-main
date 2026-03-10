const mongoose = require('mongoose');

const usersDB = mongoose.createConnection(process.env.MONGODB_URI_Users);

const AgentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    status: { type: String, default: 'active' },
    uniqueId: { type: String, unique: true, sparse: true },
    isOnline: { type: Boolean, default: false },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        lastUpdated: { type: Date }
    }
}, { timestamps: true, collection: 'Deliveryagent' });

module.exports = usersDB.model('Agent', AgentSchema);
