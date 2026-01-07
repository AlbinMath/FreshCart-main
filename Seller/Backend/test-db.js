const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        console.log("Attempting to connect to:", process.env.MONGODB_URI_Users);
        const conn = await mongoose.connect(process.env.MONGODB_URI_Users);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Define simple schema to read whatever is there
        const sellerSchema = new mongoose.Schema({}, { strict: false, collection: 'Seller' });
        const Seller = mongoose.model('SellerDebug', sellerSchema);

        const count = await Seller.countDocuments();
        console.log(`Found ${count} documents in 'Seller' collection`);

        const sellers = await Seller.find().limit(5);
        console.log("Sample Sellers:", JSON.stringify(sellers, null, 2));

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

connectDB();
