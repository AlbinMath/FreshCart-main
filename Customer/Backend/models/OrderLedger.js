const mongoose = require('mongoose');
const { usersConn } = require('../server');
const createOrderLedgerSchema = require('../../../Shared/OrderIntegrity/models/OrderLedgerSchema');

const OrderLedgerSchema = createOrderLedgerSchema(mongoose);

module.exports = usersConn.model('OrderLedger', OrderLedgerSchema);
