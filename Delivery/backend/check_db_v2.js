const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const emailToFind = "lijithmk357@gmail.com";

const checkDatabase = async (uriName, uri) => {
    if (!uri) {
        console.log(`Skipping ${uriName} (not defined)`);
        return;
    }

    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Checking ${uriName}: ${maskedUri}`);

    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log(`  Connected to ${uriName}`);

        const collections = await conn.db.listCollections().toArray();
        console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);

        for (const col of collections) {
            const doc = await conn.db.collection(col.name).findOne({ email: emailToFind });
            if (doc) {
                console.log(`  [FOUND!] User found in ${uriName} -> collection: ${col.name}`);
                console.log(`  _id: ${doc._id}`);
                console.log(`  status: ${doc.status}`);
            }
        }

        await conn.close();
    } catch (err) {
        console.log(`  Error connecting to ${uriName}: ${err.message}`);
    }
};

const main = async () => {
    console.log("Starting Search...");

    await checkDatabase('MONGODB_URI_Deliveryagent', process.env.MONGODB_URI_Deliveryagent);
    await checkDatabase('MONGODB_URI_Registrations', process.env.MONGODB_URI_Registrations);
    await checkDatabase('MONGODB_URI_Users', process.env.MONGODB_URI_Users);
    // await checkDatabase('MONGODB_URI', process.env.MONGODB_URI); // Main one

    console.log("Search Complete.");
};

main();
