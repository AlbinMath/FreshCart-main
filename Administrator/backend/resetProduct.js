const mongoose = require('mongoose');
require('dotenv').config();

const resetProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI_Products);
        console.log('Connected to Products DB...');

        const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

        const res = await Product.updateOne(
            { _id: "694133e84702280eeb0ea815" },
            { $set: { status: 'active', approvalStatus: 'Approved' } }
        );

        console.log('Update result:', res);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetProduct();
