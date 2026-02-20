const express = require('express');
const router = express.Router();
const OrderLedger = require('../models/OrderLedger');
const { verifyChain } = require('../utils/ledgerUtils');

// Get Chain & Verification Status for an Order
router.get('/chain/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const chainRecord = await OrderLedger.findOne({ orderId });

        if (!chainRecord) {
            return res.status(404).json({ success: false, message: "No blockchain record found for this order" });
        }

        // Run Verification
        const verification = await verifyChain(chainRecord.chain);

        res.json({
            success: true,
            orderId,
            chain: chainRecord.chain,
            currentHash: chainRecord.currentHash,
            status: verification.valid ? "VALID" : "TAMPERED",
            riskLevel: verification.valid ? "LOW" : "HIGH",
            issues: verification.reason || null,
            verifiedByAdmin: chainRecord.verifiedByAdmin
        });

    } catch (error) {
        console.error("Error fetching chain:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Admin manually verifies/freezes a chain
router.post('/verify/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const chainRecord = await OrderLedger.findOne({ orderId });

        if (!chainRecord) {
            return res.status(404).json({ success: false, message: "No chain found" });
        }

        // Run Logic
        const verification = await verifyChain(chainRecord.chain);

        if (verification.valid) {
            chainRecord.verifiedByAdmin = true;
            await chainRecord.save();
            res.json({ success: true, message: "Chain verified and marked as trusted by Administrator" });
        } else {
            res.status(400).json({ success: false, message: "Cannot verify tampered chain", issues: verification.reason });
        }

    } catch (error) {
        console.error("Error verifying chain:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
