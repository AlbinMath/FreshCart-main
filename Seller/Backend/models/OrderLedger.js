const mongoose = require('mongoose');
const createOrderLedgerSchema = require('../../../Shared/OrderIntegrity/models/OrderLedgerSchema');

const OrderLedgerSchema = createOrderLedgerSchema(mongoose);

module.exports = mongoose.model('OrderLedger', OrderLedgerSchema);
