const mongoose = require('mongoose');
const { usersConn } = require('../db');
const createOrderLedgerSchema = require('../../../Shared/OrderIntegrity/models/OrderLedgerSchema');

const OrderLedgerSchema = createOrderLedgerSchema(mongoose);

module.exports = usersConn.model('OrderLedger', OrderLedgerSchema);
