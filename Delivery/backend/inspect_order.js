const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI_Users)
    .then(async () => {
        console.log('Connected to DB');
        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5);

        console.log('--- Inspecting Orders for Payment Fields ---');
        orders.forEach(order => {
            const obj = order.toObject();
            console.log(`Order ID: ${obj._id}`);
            console.log(`Keys: ${Object.keys(obj).join(', ')}`);
            console.log('Payment Field Candidates:',
                JSON.stringify({
                    paymentMethod: obj.paymentMethod,
                    payment_method: obj.payment_method,
                    paymentStatus: obj.paymentStatus,
                    payment_status: obj.payment_status,
                    method: obj.method
                }, null, 2)
            );
            console.log('-------------------------------------------');
        });

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
