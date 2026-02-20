const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const sellerSchema = new mongoose.Schema({}, { strict: false });
const Seller = mongoose.model('Seller', sellerSchema, 'Seller'); // Explicit collection name

async function checkSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI_Users);
        console.log('Connected to DB');

        const seller = await Seller.findOne({});
        console.log('Sample Seller:', JSON.stringify(seller, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkSellers();
