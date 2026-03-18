const serverless = require('serverless-http');
const app = require('../server'); // Point to your exported express app

module.exports.handler = serverless(app);
