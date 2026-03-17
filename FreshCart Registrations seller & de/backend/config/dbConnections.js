const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const usersDB = mongoose.createConnection(process.env.MONGODB_URI_Users, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const announcementsDB = mongoose.createConnection(process.env.MONGODB_URI_Announcements, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const registrationsDB = mongoose.createConnection(process.env.MONGODB_URI_Registrations, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Event listeners for connection status
usersDB.on('connected', () => console.log('Connected to Users DB'));
usersDB.on('error', (err) => console.error('Users DB connection error:', err));

announcementsDB.on('connected', () => console.log('Connected to Announcements DB'));
announcementsDB.on('error', (err) => console.error('Announcements DB connection error:', err));

registrationsDB.on('connected', () => console.log('Connected to Registrations DB'));
registrationsDB.on('error', (err) => console.error('Registrations DB connection error:', err));

module.exports = {
    usersDB,
    announcementsDB,
    registrationsDB
};
