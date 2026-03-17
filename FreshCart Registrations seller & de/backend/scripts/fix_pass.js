const mongoose = require('mongoose');
require('dotenv').config();

console.log('--- STARTING FIX ---');

const mongoose = require('mongoose');
require('dotenv').config();

console.log('--- STARTING FIX ---');

let uri = process.env.MONGODB_URI_Users;
console.log('MONGODB_URI_Users:', uri); // Be careful if it prints secrets, but "URL" is safe.

if (!uri || uri.length < 10) {
    console.log('MONGODB_URI_Users seems invalid. Checking MONGODB_URI...');
    uri = process.env.MONGODB_URI;
    console.log('MONGODB_URI length:', uri ? uri.length : 'undefined');
}

if (!uri || uri.length < 10) {
    console.error('ERROR: No valid MongoDB URI found.');
    process.exit(1);
}

// Ensure we connect to 'User' db if we use the generic URI
// But if the URI includes the DB name, it overrides.
// We'll trust the URI + specify dbName just in case?
// createConnection(uri, options)
const conn = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'User' // Force database name as requested
});

conn.on('connected', () => console.log('DB Connected'));
conn.on('error', err => { console.error('DB Error:', err); process.exit(1); });

const schema = new mongoose.Schema({}, { strict: false, collection: 'Administrator' });
const AdminModel = conn.model('Administrator', schema);

const email = 'albinmathew2026@mca.ajce.in';
const newPass = '$2b$10$fHUTNCzRpKC9cjTjlSVP3uW4Cb3BQ6SoufVuDsCY.3C9WI8iWLnW';

async function run() {
    // Wait for open
    if (conn.readyState !== 1) {
        await new Promise(resolve => conn.once('open', resolve));
    }

    console.log(`Searching for ${email}...`);
    const user = await AdminModel.findOne({ email });

    if (!user) {
        console.log('User NOT FOUND in "Administrator" collection.');
    } else {
        console.log('User FOUND. ID:', user._id);
        const res = await AdminModel.updateOne({ _id: user._id }, { $set: { password: newPass } });
        console.log('Update result:', res);
        console.log('PASSWORD UPDATED SUCCESSFULLY.');
    }
    conn.close();
    process.exit(0);
}

run().catch(err => {
    console.error('Run Error:', err);
    process.exit(1);
});
