const Administrator = require('../models/Administrator');
require('dotenv').config();

const newHash = '$2b$10$fHUTNCzRpKC9cjTjlSVP3uW4Cb3BQ6SoufVuDsCY.3C9WI8iWLnW';
const email = 'albinmathew2026@mca.ajce.in';

async function updatePassword() {
    try {
        console.log('Script started.');
        console.log(`Looking for user: ${email}`);

        // Wait for connection
        console.log('Waiting for connection...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Debug: Check if model is usable
        console.log('Checking if we can find the user first...');
        const user = await Administrator.findOne({ email: email });
        console.log('User found:', user ? user._id : 'NO USER FOUND');

        if (!user) {
            console.log('Aborting update because user was not found.');
            process.exit(1);
        }

        console.log('Updating password...');
        const result = await Administrator.updateOne(
            { email: email },
            { $set: { password: newHash } }
        );

        console.log('Update Result:', result);
        process.exit(0);
    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        process.exit(1);
    }
}

updatePassword();
