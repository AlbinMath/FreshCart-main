const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect directly to the USERS DB (same as Admin model uses)
const USERS_DB_URI = process.env.MONGODB_URI_Users;

const adminSchema = new mongoose.Schema({
    name: String,
    email: { type: String, lowercase: true },
    password: String,
    role: { type: String, default: 'admin' }
}, { collection: 'Admin' });

const resetAdmin = async () => {
    try {
        console.log('Connecting to Users DB:', USERS_DB_URI);
        const conn = await mongoose.createConnection(USERS_DB_URI).asPromise();
        console.log('Connected to Users DB ✅');

        const AdminModel = conn.model('Admin', adminSchema);

        const email = 'cartfresh44@gmail.com';
        const plainPassword = 'Admin@123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        const existing = await AdminModel.findOne({ email });

        if (existing) {
            existing.password = hashedPassword;
            await existing.save();
            console.log(`✅ Password reset for existing admin: ${email}`);
        } else {
            await AdminModel.create({
                name: 'FreshCart Admin',
                email,
                password: hashedPassword,
                role: 'admin'
            });
            console.log(`✅ New admin created: ${email}`);
        }

        console.log('\n--- LOGIN CREDENTIALS ---');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${plainPassword}`);
        console.log(`Role:     admin (select "Super Admin")`);
        console.log('-------------------------\n');

        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

resetAdmin();
