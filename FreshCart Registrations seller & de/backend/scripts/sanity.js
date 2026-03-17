console.log('Sanity Check Start');
try {
    const dotenv = require('dotenv');
    console.log('Dotenv loaded type:', typeof dotenv);
    const mongoose = require('mongoose');
    console.log('Mongoose loaded type:', typeof mongoose);
} catch (e) {
    console.error('Require Exception:', e);
}
console.log('Sanity Check End');
