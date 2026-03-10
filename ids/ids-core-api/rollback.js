const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://albinmathewtomo:albinmathewtomo@registrations.jj9mvgr.mongodb.net/IDS_Database?retryWrites=true&w=majority').then(async () => {
    const Order = mongoose.model('Order', new mongoose.Schema({ status: String }, { strict: false }));
    const Cluster = mongoose.model('Cluster', new mongoose.Schema({ assigned_agent_id: String }, { strict: false }));

    const orderRes = await Order.updateMany({ status: 'clustered' }, { $set: { status: 'pending' } });
    console.log('Orders updated:', orderRes);

    const clusterRes = await Cluster.deleteMany({ assigned_agent_id: null });
    console.log('Clusters deleted:', clusterRes);

    console.log('Reverted orders and deleted ghost clusters');
    process.exit(0);
});
