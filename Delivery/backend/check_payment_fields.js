const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI_Users)
    .then(async () => {
        console.log('Connected');
        // Find an order that has ANY payment related field
        const order = await Order.findOne({
            $or: [
                { paymentMethod: { $exists: true } },
                { payment_method: { $exists: true } }
            ]
        });

        if (order) {
            const o = order.toObject();
            console.log('Found Order with Payment Info:');
            console.log('paymentMethod:', o.paymentMethod);
            console.log('payment_method:', o.payment_method);
            console.log('paymentStatus:', o.paymentStatus);
            console.log('payment_status:', o.payment_status);
        } else {
            console.log('No orders with payment info found. Checking any order...');
            const anyOrder = await Order.findOne({});
            if (anyOrder) console.log(JSON.stringify(anyOrder.toObject(), null, 2));
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
