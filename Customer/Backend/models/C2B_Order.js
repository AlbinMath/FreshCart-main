const mongoose = require('mongoose');
const { customerConn } = require('../db');
const c2bOrderSchemaOptions = require('../../../Shared/OrderIntegrity/models/C2B_OrderSchema');

// Create the model using the shared schema and customer connection
const C2B_Order = customerConn.model('C2B_Order', c2bOrderSchemaOptions(mongoose));

module.exports = C2B_Order;
