const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DeliveryAgent = require('./models/DeliveryAgent');

dotenv.config();

const uri = process.env.MONGODB_URI_Deliveryagent;
// Mask password in log
const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log('Connecting to:', maskedUri);

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected successfully to MongoDB!');

        // Try finding the user from the image
        const email = "lijithmk357@gmail.com";
        console.log(`Searching for user with email: ${email}`);

        const user = await DeliveryAgent.findOne({ email: targetEmail });

        if (user) {
            console.log('SUCCESS: User found using existing Mongoose model!');
            console.log('User ID:', user._id);
            console.log('Full Name:', user.fullName);
            console.log('Email:', user.email);
        } else {
            console.log('WARNING: User NOT found with current Mongoose model configuration.');

            // List collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('Available collections in database:', collections.map(c => c.name));

            // Try to find in other collections if any
            let foundInCol = false;
            for (const col of collections) {
                const found = await mongoose.connection.db.collection(col.name).findOne({ email: targetEmail });
                if (found) {
                    console.log(`SUCCESS: User FOUND in collection: '${col.name}'`);
                    console.log('You should update the model to use this collection name.');
                    foundInCol = true;
                }
            }

            if (!foundInCol) {
                console.log('ERROR: User not found in ANY collection in this database.');
            }
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error('CONNECTION ERROR:', err);
        process.exit(1);
    });
