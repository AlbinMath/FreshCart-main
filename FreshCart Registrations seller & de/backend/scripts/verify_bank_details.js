const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyBankDetails() {
    try {
        const uri = process.env.MONGODB_URI_Registrations;
        if (!uri) throw new Error('MONGODB_URI_Registrations not found');

        const conn = await mongoose.createConnection(uri).asPromise();
        console.log('Connected to Registrations DB');

        // Define minimal Schema
        const SellerSchema = new mongoose.Schema({
            sellerName: String,
            bankAccountHolderName: String,
            bankAccountNumber: String,
            ifscCode: String,
            upiId: String
        });
        const Seller = conn.model('Seller', SellerSchema);

        const sellers = await Seller.find({}).select('sellerName bankAccountHolderName bankAccountNumber ifscCode upiId');

        console.log(`Found ${sellers.length} sellers.`);

        let hasBankDetails = false;
        sellers.forEach(s => {
            if (s.bankAccountNumber || s.bankAccountHolderName) {
                hasBankDetails = true;
                console.log(`Seller: ${s.sellerName} has details: Account: ${s.bankAccountNumber}, Holder: ${s.bankAccountHolderName}`);
            } else {
                console.log(`Seller: ${s.sellerName} has NO bank details.`);
            }
        });

        if (!hasBankDetails) {
            console.log('WARNING: No sellers have bank details in the database.');
        }

        await conn.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyBankDetails();
