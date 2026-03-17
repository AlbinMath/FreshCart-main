const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'cartfresh44@gmail.com';
        const adminPassword = 'Admin@123';

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`Admin ${adminEmail} already exists. Updating password...`);
            existingAdmin.password = adminPassword;
            await existingAdmin.save();
            console.log('Password updated successfully.');
        } else {
            console.log(`Creating new admin: ${adminEmail}`);
            const newAdmin = new Admin({
                name: 'FreshCart Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            await newAdmin.save();
            console.log('Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
