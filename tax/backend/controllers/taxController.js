const { calculateOrderTax, TAX_SLABS } = require('../services/taxCalculator');
const OrderLedger = require('../models/OrderLedger');
const { createNextBlock } = require('../utils/ledgerUtils');

exports.calculateTax = async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.items || !Array.isArray(payload.items)) {
            return res.status(400).json({ error: "Invalid payload: 'items' array is required" });
        }

        const result = calculateOrderTax(payload);

        // ORDER_INTEGRITY: Record Tax Calculation if Order ID exists
        if (payload.orderId) {
            try {
                const ledgerRecord = await OrderLedger.findOne({ orderId: payload.orderId });
                if (ledgerRecord) {
                    const lastBlock = ledgerRecord.chain[ledgerRecord.chain.length - 1];
                    const newBlock = await createNextBlock(
                        lastBlock,
                        "TAX_CALCULATED",
                        "SYSTEM",
                        "TAX_SERVICE",
                        {
                            totalTax: result.totals.totalTax,
                            grandTotal: result.totals.grandTotal,
                            breakdown: result.breakdown
                        }
                    );
                    ledgerRecord.chain.push(newBlock);
                    ledgerRecord.currentHash = newBlock.hash;
                    await ledgerRecord.save();
                    console.log(`[OrderIntegrity] Tax calculation recorded for ${payload.orderId}`);
                }
            } catch (err) {
                console.error("[OrderIntegrity] Failed to record tax event:", err);
            }
        }

        res.json({ success: true, data: result });

    } catch (error) {
        console.error("Tax Calculation Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.getTaxRules = (req, res) => {
    res.json({
        success: true,
        data: {
            slabs: TAX_SLABS,
            deliveryRate: 18,
            platformFeeRate: 18,
            tcsRate: 1
        }
    });
};

exports.validateGstin = (req, res) => {
    // Mock validation
    const { gstin } = req.body;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (gstinRegex.test(gstin)) {
        res.json({ success: true, valid: true, message: "Valid GSTIN format" });
    } else {
        res.json({ success: true, valid: false, message: "Invalid GSTIN format" });
    }
};

exports.recordFuelMetrics = async (req, res) => {
    try {
        const { orderId, originalDistanceKm, optimizedDistanceKm, fuelSavedLiters } = req.body;

        if (orderId) {
            const ledgerRecord = await OrderLedger.findOne({ orderId });
            if (ledgerRecord) {
                const lastBlock = ledgerRecord.chain[ledgerRecord.chain.length - 1];
                const newBlock = await createNextBlock(
                    lastBlock,
                    "FUEL_SAVINGS_RECORDED",
                    "SYSTEM",
                    "TAX_SERVICE",
                    {
                        originalDistanceKm,
                        optimizedDistanceKm,
                        fuelSavedLiters,
                        carbonReducedKg: fuelSavedLiters * 2.31 // approximate CO2 per liter
                    }
                );
                ledgerRecord.chain.push(newBlock);
                ledgerRecord.currentHash = newBlock.hash;
                await ledgerRecord.save();
                console.log(`[TaxService] Fuel metrics recorded for ${orderId}: Saved ${fuelSavedLiters}L`);
            }
        }
        res.json({ success: true, message: "Fuel metrics processed" });
    } catch (error) {
        console.error("Error tracking fuel metrics:", error);
        res.status(500).json({ success: false });
    }
};
