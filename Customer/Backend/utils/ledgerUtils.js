const axios = require('axios');

const SERVICE_URL = process.env.ORDER_INTEGRITY_SERVICE_URL || 'http://localhost:5011';

/**
 * OrderIntegrity: Microservice Client
 */

// Calculate SHA256 Hash (Remote)
const calculateHash = async (index, previousHash, timestamp, event, data) => {
    try {
        const response = await axios.post(`${SERVICE_URL}/calc-hash`, {
            index, previousHash, timestamp, event, data
        });
        return response.data.hash;
    } catch (error) {
        console.error("Ledger Service Error (calcHash):", error.message);
        throw error;
    }
};

// Create Genesis Block (Remote)
const createGenesisBlock = async (orderId, userId) => {
    try {
        const response = await axios.post(`${SERVICE_URL}/create-genesis`, {
            orderId, userId
        });
        if (response.data.success) {
            return response.data.ledger;
        }
        throw new Error("Failed to create genesis block");
    } catch (error) {
        console.error("Ledger Service Error (createGenesis):", error.message);
        throw error;
    }
};

// Create Next Block (Remote)
const createNextBlock = async (lastBlock, event, actor, actorId, data) => {
    try {
        const response = await axios.post(`${SERVICE_URL}/create-next`, {
            lastBlock, event, actor, actorId, data
        });
        if (response.data.success) {
            return response.data.block;
        }
        throw new Error("Failed to create next block");
    } catch (error) {
        console.error("Ledger Service Error (createNext):", error.message);
        throw error;
    }
};

// Verify Chain Integrity (Remote)
const verifyChain = async (chain) => {
    try {
        const response = await axios.post(`${SERVICE_URL}/verify`, { chain });
        return response.data; // { valid: boolean, message: string }
    } catch (error) {
        console.error("Ledger Service Error (verifyChain):", error.message);
        return { valid: false, reason: "Service Unavailable" };
    }
};

module.exports = {
    calculateHash,
    createGenesisBlock,
    createNextBlock,
    verifyChain
};

