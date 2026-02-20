const mongoose = require('mongoose');
const crypto = require('crypto');

// DB URI from Administrator/.env (CONFIRMED: Users DB)
// Using local .env would be better but hardcoding for script safety
const MONGODB_URI = "mongodb+srv://albinmathewtomo:albinmathewtomo@registrations.jj9mvgr.mongodb.net/Users?appName=Registrations";

// Minimal Schema Definition for Verification Script
const OrderLedgerSchema = new mongoose.Schema({
    orderId: String,
    currentHash: String,
    chain: [{
        index: Number,
        event: String,
        timestamp: Date,
        actor: String,
        actorId: String,
        data: Object,
        previousHash: String,
        hash: String
    }],
    verifiedByAdmin: Boolean
});

// Calculate SHA256 Hash
const calculateHash = (index, previousHash, timestamp, event, data) => {
    const payload = index + previousHash + timestamp + event + JSON.stringify(data);
    return crypto.createHash('sha256').update(payload).digest('hex');
};

// Verify the integrity of a chain
const verifyChain = (chain) => {
    for (let i = 1; i < chain.length; i++) {
        const currentBlock = chain[i];
        const previousBlock = chain[i - 1];

        // 1. Check if previousHash matches
        if (currentBlock.previousHash !== previousBlock.hash) {
            return { valid: false, reason: `Broken Link at index ${i}: Previous Hash Mismatch` };
        }

        // 2. Check if hash is valid (re-calculate)
        const recalculatedHash = calculateHash(
            currentBlock.index,
            currentBlock.previousHash,
            currentBlock.timestamp,
            currentBlock.event,
            currentBlock.data
        );

        if (currentBlock.hash !== recalculatedHash) {
            return { valid: false, reason: `Data Tampered at index ${i}: Hash Mismatch` };
        }
    }
    return { valid: true };
};

const OrderLedger = mongoose.model('OrderLedger', OrderLedgerSchema);

async function runVerification() {
    try {
        console.log("Connecting to MongoDB (Users DB)...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        console.log("Fetching latest ledgers...");
        const chains = await OrderLedger.find().sort({ createdAt: -1 }).limit(5);

        if (chains.length === 0) {
            console.log("No ledgers found. Waiting for first order.");
            return;
        }

        for (const chainRecord of chains) {
            console.log(`\nVerifying Ledger for Order: ${chainRecord.orderId}`);
            console.log(`Length: ${chainRecord.chain.length} blocks`);

            const result = verifyChain(chainRecord.chain);

            if (result.valid) {
                console.log("✅ STATUS: VALID");
                // Identify flow
                const events = chainRecord.chain.map(b => b.event).join(" -> ");
                console.log(`Flow: ${events}`);
            } else {
                console.log("❌ STATUS: TAMPERED/INVALID");
                console.log(`Reason: ${result.reason}`);
            }
        }

    } catch (error) {
        console.error("Simulation Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected.");
    }
}

runVerification();
