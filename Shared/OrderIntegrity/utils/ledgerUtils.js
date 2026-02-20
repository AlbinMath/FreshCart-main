const crypto = require('crypto');

/**
 * OrderIntegrity: Blockchain-Lite Logic
 * Shared Utility
 */

// Calculate SHA256 Hash
const calculateHash = (index, previousHash, timestamp, event, data) => {
    // Ensure deterministic stringify? For simple objects, JSON.stringify is usually fine if order matches.
    // For production, use 'fast-json-stable-stringify' or similar.
    const payload = index + previousHash + timestamp + event + JSON.stringify(data);
    return crypto.createHash('sha256').update(payload).digest('hex');
};

// Create Genesis Block
const createGenesisBlock = (orderId, userId) => {
    const timestamp = new Date().toISOString();
    const genesisData = { message: "Genesis Block", orderId, userId };
    const hash = calculateHash(0, "0", timestamp, "ORDER_CREATED", genesisData);

    return {
        orderId,
        currentHash: hash,
        chain: [{
            index: 0,
            event: "ORDER_CREATED",
            timestamp,
            actor: "USER",
            actorId: userId,
            data: genesisData,
            previousHash: "0",
            hash: hash
        }]
    };
};

// Create Next Block
const createNextBlock = (lastBlock, event, actor, actorId, data) => {
    const index = lastBlock.index + 1;
    const timestamp = new Date().toISOString();
    const previousHash = lastBlock.hash;
    const hash = calculateHash(index, previousHash, timestamp, event, data);

    return {
        index,
        event,
        timestamp,
        actor,
        actorId,
        data,
        previousHash,
        hash
    };
};

// Verify Chain Integrity
const verifyChain = (chain) => {
    for (let i = 1; i < chain.length; i++) {
        const currentBlock = chain[i];
        const previousBlock = chain[i - 1];

        // 1. Check Link
        if (currentBlock.previousHash !== previousBlock.hash) {
            return { valid: false, reason: `Broken Link at index ${i}` };
        }

        // 2. Check Hash Validity
        const recalculatedHash = calculateHash(
            currentBlock.index,
            currentBlock.previousHash,
            currentBlock.timestamp,
            currentBlock.event,
            currentBlock.data
        );

        if (currentBlock.hash !== recalculatedHash) {
            return { valid: false, reason: `Tampered Data at index ${i}` };
        }
    }
    return { valid: true };
};

module.exports = {
    calculateHash,
    createGenesisBlock,
    createNextBlock,
    verifyChain
};
