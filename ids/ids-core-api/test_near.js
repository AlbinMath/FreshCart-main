const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://albinmathewtomo:albinmathewtomo@registrations.jj9mvgr.mongodb.net/IDS_Database?retryWrites=true&w=majority').then(async () => {
    const Agent = mongoose.model('Agent', new mongoose.Schema({ status: String, current_location: Object }, { strict: false }));
    const allAgents = await Agent.find();
    console.log('All agents:', allAgents);

    const nearbyAgents = await Agent.find({
        status: 'available',
        current_location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [76.22187413, 10.55690653] // From pythonCluster centroid
                },
                $maxDistance: 10000
            }
        }
    });
    console.log('Nearby agents count:', nearbyAgents.length);
    console.log('Nearby agents:', nearbyAgents);
    process.exit(0);
});
