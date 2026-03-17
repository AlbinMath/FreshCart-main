const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyVehicleRegNo() {
    try {
        const uri = process.env.MONGODB_URI_Registrations;
        if (!uri) throw new Error('MONGODB_URI_Registrations not found');

        const conn = await mongoose.createConnection(uri).asPromise();
        console.log('Connected to Registrations DB');

        // Define minimal Schema
        const DeliveryAgentSchema = new mongoose.Schema({
            fullName: String,
            vehicleRegistrationNumber: String,
            status: String
        });
        const Deliveryagent = conn.model('Deliveryagent', DeliveryAgentSchema);

        const agents = await Deliveryagent.find({ status: 'approved' }).select('fullName vehicleRegistrationNumber status');

        console.log(`Found ${agents.length} approved delivery agents.`);

        let hasRegNo = false;
        agents.forEach(a => {
            if (a.vehicleRegistrationNumber) {
                hasRegNo = true;
                console.log(`Agent: ${a.fullName} has RegNo: ${a.vehicleRegistrationNumber}`);
            } else {
                console.log(`Agent: ${a.fullName} has NO RegNo.`);
            }
        });

        if (!hasRegNo) {
            console.log('WARNING: No approved agents have vehicleRegistrationNumber in the database.');
        }

        await conn.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyVehicleRegNo();
