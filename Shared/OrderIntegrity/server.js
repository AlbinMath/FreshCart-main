const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { verifyChain, calculateHash, createGenesisBlock, createNextBlock } = require('./utils/ledgerUtils');

const app = express();
const PORT = process.env.PORT || 5011;

app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Order Integrity Service', timestamp: new Date() });
});

// Verified Chain Integrity
app.post('/verify', (req, res) => {
    const { chain } = req.body;

    if (!chain || !Array.isArray(chain)) {
        return res.status(400).json({ error: 'Invalid payload: chain (array) is required' });
    }

    try {
        const result = verifyChain(chain);
        res.json({ valid: result.valid, message: result.reason || 'Chain integrity verified successfully.' });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create Genesis Block
app.post('/create-genesis', (req, res) => {
    const { orderId, userId } = req.body;
    if (!orderId || !userId) {
        return res.status(400).json({ error: 'Missing orderId or userId' });
    }
    try {
        const ledger = createGenesisBlock(orderId, userId);
        res.json({ success: true, ledger });
    } catch (error) {
        console.error("Genesis creation error:", error);
        res.status(500).json({ error: 'Failed to create genesis block' });
    }
});

// Create Next Block
app.post('/create-next', (req, res) => {
    const { lastBlock, event, actor, actorId, data } = req.body;
    if (!lastBlock || !event || !actor || !actorId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const newBlock = createNextBlock(lastBlock, event, actor, actorId, data);
        res.json({ success: true, block: newBlock });
    } catch (error) {
        console.error("Block creation error:", error);
        res.status(500).json({ error: 'Failed to create next block' });
    }
});

// Utility: Calculate Hash (Helper for clients)
app.post('/calc-hash', (req, res) => {
    const { index, previousHash, timestamp, event, data } = req.body;
    if (index === undefined || !previousHash || !timestamp || !event) {
        return res.status(400).json({ error: 'Missing required fields for hash calculation' });
    }
    const hash = calculateHash(index, previousHash, timestamp, event, data);
    res.json({ hash });
});

app.listen(PORT, () => {
    console.log(`Order Integrity Service running on port ${PORT}`);
});
