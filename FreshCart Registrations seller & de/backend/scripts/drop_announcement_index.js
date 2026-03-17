const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function dropAnnouncementIndex() {
    try {
        const uri = process.env.MONGODB_URI_Announcements;
        if (!uri) throw new Error('MONGODB_URI_Announcements not found');

        const conn = await mongoose.createConnection(uri).asPromise();
        console.log('Connected to Announcements DB');

        const AnnouncementSchema = new mongoose.Schema({
            title: String,
            content: String,
            date: String,
            author: String
        }, { collection: 'Announcements', timestamps: true });

        // We need to access the collection directly to drop the index
        const collection = conn.collection('Announcements');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const ttlIndex = indexes.find(idx => idx.key.createdAt === 1);

        if (ttlIndex) {
            console.log(`Found TTL index: ${ttlIndex.name}. Dropping it...`);
            await collection.dropIndex(ttlIndex.name);
            console.log('Old TTL index dropped. Restart the server to create the new index.');
        } else {
            console.log('No TTL index found on createdAt.');
        }

        await conn.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

dropAnnouncementIndex();
