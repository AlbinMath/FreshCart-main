const mongoose = require('mongoose');
const idsDB = require('../config/idsDB');

const clusterSchema = new mongoose.Schema({
    cluster_id: String,
    centroid: Object,
    type: String,
    coordinates: Array,
    order_ids: Array,
    assigned_agent_id: String,
    route_sequence: Array,
    status: String,
    createdAt: Date,
    updatedAt: Date
}, { strict: false });

module.exports = idsDB.model('Cluster', clusterSchema, 'clusters');
