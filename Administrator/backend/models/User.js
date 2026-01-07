const mongoose = require('mongoose');

// The collection is specified as 'Users.Administrator' in the prompt, but usually collection names are just 'Administrator'
// if using a separate model or within 'Users' collection with a discriminator.
// However, the prompt says "Collections is Users.Administrator".
// This might mean: Database is "Users" and Collection is "Administrator".
// My server.js connects to `MONGODB_URI_Users`.
// So inside that DB, I should look for 'Administrator' collection or similar.
// I will assume the collection name is 'Administrator'.

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String, // In production, this should be hashed
        required: true
    },
    role: {
        type: String,
        default: 'Admin' // or 'Super' as seen in the screenshot
    },
    name: {
        type: String
    }
}, { collection: 'Administrator' }); // Explicitly set collection name if needed, but Mongoose pluralizes 'User' -> 'users' by default. 
// Given the prompt "Collections is Users.Administrator", I'll try to target 'Administrator' specifically.

module.exports = mongoose.model('User', userSchema);
