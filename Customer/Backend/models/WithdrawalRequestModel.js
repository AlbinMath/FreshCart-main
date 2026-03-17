const mongoose = require('mongoose');
const { customerConn } = require('../db');
const withdrawalRequestSchema = require('./WithdrawalRequest');

// Use static connections for models to avoid server.js circular dependency
const WithdrawalRequest = customerConn.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;
