const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect directly to the USERS DB (same as Administrator model uses)
const USERS_DB_URI = process.env.MONGODB_URI_Users;

const administratorSchema = new mongoose.Schema({
    name: String,
    email: { type: String, lowercase: true },
    password: String,
    role: { type: String, default: 'Administrator' }
}, { collection: 'Administrator' });

const resetAdministrator = async () => {
    try {
        console.log('Connecting to Users DB:', USERS_DB_URI);
        const conn = await mongoose.createConnection(USERS_DB_URI).asPromise();
        console.log('Connected to Users DB ✅');

        const AdministratorModel = conn.model('Administrator', administratorSchema);

        const email = 'albinmathew2026@mca.ajce.in';
        const plainPassword = 'Admin@123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        const existing = await AdministratorModel.findOne({ email });

        if (existing) {
            existing.password = hashedPassword;
            await existing.save();
            console.log(`✅ Password reset for existing Administrator: ${email}`);
        } else {
            await AdministratorModel.create({
                name: 'Albin Mathew',
                email,
                password: hashedPassword,
                role: 'Administrator'
            });
            console.log(`✅ New Administrator created: ${email}`);
        }

        console.log('\n--- ADMINISTRATOR LOGIN CREDENTIALS ---');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${plainPassword}`);
        console.log(`Role:     Administrator (select "Administrator")`);
        console.log('---------------------------------------\n');

        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

resetAdministrator();
