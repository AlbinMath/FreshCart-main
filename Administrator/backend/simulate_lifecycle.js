const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// --- IMPORTS (Simulating Service Logic) ---
// We import the LOCAL module which now wraps the Microservice API.
const { createGenesisBlock, createNextBlock, verifyChain } = require('./utils/ledgerUtils');
const createOrderLedgerSchema = require('../../Shared/OrderIntegrity/models/OrderLedgerSchema');

// --- SETUP ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://albinmathewtomo:albinmathewtomo@registrations.jj9mvgr.mongodb.net/Users?appName=Registrations";
const OrderLedgerSchema = createOrderLedgerSchema(mongoose);
const OrderLedger = mongoose.model('OrderLedger_Simulation', OrderLedgerSchema); // Use separate collection or model name to avoid conflict? No, same collection is fine for test.

const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
    console.log("🚀 STARTING ORDER INTEGRITY SIMULATION 🚀");
    console.log("-----------------------------------------");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to Database");

    // 1. DATA PREP
    const orderId = `SIM_ORD_${Date.now()}`;
    const userId = "USER_SIM_001";
    console.log(`\n📦 SCENARIO: Order ${orderId} placed by ${userId}`);

    try {
        // --- STEP 1: CUSTOMER SERVICE (Order Creation) ---
        console.log("\n[1] CUSTOMER SERVICE: Minting Genesis Block...");

        // Simulating the logic from paymentRoutes.js
        const ledgerData = await createGenesisBlock(orderId, userId);
        const newLedger = new OrderLedger(ledgerData);
        await newLedger.save();

        console.log(`    ➔ Genesis Block Created! Hash: ${ledgerData.currentHash}`);
        console.log(`    ➔ Ledger Saved to DB.`);

        await SLEEP(1000);

        // --- STEP 2: TAX SERVICE (Audit) ---
        console.log("\n[2] TAX SERVICE: Calculating & Logging Tax...");

        // Simulating taxController.js logic
        let ledger = await OrderLedger.findOne({ orderId });
        let lastBlock = ledger.chain[ledger.chain.length - 1];

        const taxBlock = await createNextBlock(
            lastBlock,
            "TAX_CALCULATED",
            "SYSTEM",
            "TAX_SERVICE",
            { totalTax: 150, grandTotal: 1150 }
        );

        ledger.chain.push(taxBlock);
        ledger.currentHash = taxBlock.hash;
        await ledger.save();
        console.log(`    ➔ Tax Verified. Block #1 Appended.`);

        await SLEEP(1000);

        // --- STEP 3: SELLER SERVICE (Status Updates) ---
        console.log("\n[3] SELLER SERVICE: Updating Status...");

        // A - Order Packed
        ledger = await OrderLedger.findOne({ orderId });
        lastBlock = ledger.chain[ledger.chain.length - 1];

        const packedBlock = await createNextBlock(
            lastBlock,
            "STATUS_UPDATED_PACKED",
            "SELLER",
            "SELLER_001",
            { status: "Packed" }
        );
        ledger.chain.push(packedBlock);
        ledger.currentHash = packedBlock.hash;
        await ledger.save();
        console.log(`    ➔ Order Packed. Block #2 Appended.`);

        await SLEEP(1000);

        // B - Order Shipped
        ledger = await OrderLedger.findOne({ orderId });
        lastBlock = ledger.chain[ledger.chain.length - 1];

        const shippedBlock = await createNextBlock(
            lastBlock,
            "STATUS_UPDATED_SHIPPED",
            "SELLER",
            "SELLER_001",
            { status: "Shipped", carrier: "FedEx" }
        );
        ledger.chain.push(shippedBlock);
        ledger.currentHash = shippedBlock.hash;
        await ledger.save();
        console.log(`    ➔ Order Shipped. Block #3 Appended.`);

        // --- STEP 4: ADMIN SERVICE (Verification) ---
        console.log("\n[4] ADMIN SERVICE: Verifying Integrity...");

        ledger = await OrderLedger.findOne({ orderId });
        console.log("    ➔ Fetching full chain from DB...");

        const verificationResult = await verifyChain(ledger.chain);

        if (verificationResult.valid) {
            console.log("\n✅ VERIFICATION PASSED: Chain is Valid and Immutable.");
            console.log("-----------------------------------------");
            console.log("📜 FINAL LEDGER STATE:");
            ledger.chain.forEach(block => {
                console.log(`   [${block.index}] ${block.timestamp.toISOString().split('T')[1].replace('Z', '')} - ${block.event} (${block.hash.substring(0, 10)}...)`);
            });
        } else {
            console.error("\n❌ VERIFICATION FAILED:", verificationResult.reason);
        }

    } catch (error) {
        console.error("Simulation Failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected.");
    }
}

runSimulation();
