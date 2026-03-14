const express = require('express');
const router = express.Router();
const CustomerProduceProposal = require('../models/CustomerProduceProposal');
// We will need to interact with the C2B orders. Since we put the schema in Shared/OrderIntegrity, we need to create a model for it using customerConn or productsConn here.
const { customerConn } = require('../server');
const c2bOrderSchemaOptions = require('../../../Shared/OrderIntegrity/models/C2B_OrderSchema');
const withdrawalRequestSchema = require('../models/WithdrawalRequest');

const C2B_Order = customerConn.model('C2B_Order', c2bOrderSchemaOptions(require('mongoose')));
const WithdrawalRequest = customerConn.model('WithdrawalRequest', withdrawalRequestSchema);
const Notification = require('../models/Notification');

// Note: Assuming there is some auth middleware that sets req.user.uid. We will use a mock or standard middleware if it exists.
// Looking at other routes, we can just expect customer_id in the body or params for now if there is no auth.

const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 0. Upload Image Endpoint
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }
        
        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'c2b_proposals',
            resource_type: 'auto'
        });

        res.status(200).json({ success: true, imageUrl: result.secure_url });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: 'Image upload failed' });
    }
});

// 1. Submit a new produce pitch
router.post('/proposals', async (req, res) => {
    try {
        const { customer_id, title, description, images, category, quantityAvailable, quantityUnit, askingPrice, harvestDate, expirationDate } = req.body;

        if (!customer_id || !title || !category || !quantityAvailable || !askingPrice) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newProposal = new CustomerProduceProposal({
            customer_id,
            title,
            description,
            images,
            category,
            quantityAvailable,
            quantityUnit: quantityUnit || 'kg',
            askingPrice,
            harvestDate,
            expirationDate,
            status: 'Pending'
        });

        await newProposal.save();
        res.status(201).json({ success: true, message: 'Proposal submitted successfully', proposal: newProposal });
    } catch (error) {
        console.error('Error submitting crop proposal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. Update (edit) an existing proposal  — only if still Pending or Under Negotiation
router.put('/proposals/:id', async (req, res) => {
    try {
        const proposal = await CustomerProduceProposal.findById(req.params.id);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }
        if (proposal.status === 'Accepted') {
            return res.status(400).json({ success: false, message: 'Cannot edit an already accepted proposal' });
        }

        const { title, description, category, quantityAvailable, quantityUnit, askingPrice, harvestDate, images } = req.body;

        if (title)             proposal.title             = title;
        if (description)       proposal.description       = description;
        if (category)          proposal.category          = category;
        if (quantityAvailable) proposal.quantityAvailable = Number(quantityAvailable);
        if (quantityUnit)      proposal.quantityUnit      = quantityUnit;
        if (askingPrice)       proposal.askingPrice       = Number(askingPrice);
        if (harvestDate)       proposal.harvestDate       = harvestDate;
        if (images)            proposal.images            = images;

        await proposal.save();
        res.status(200).json({ success: true, message: 'Proposal updated successfully', proposal });
    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. Fetch the customer's active and past pitches
router.get('/proposals/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const proposals = await CustomerProduceProposal.find({ customer_id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, proposals });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. Delete a proposal (only if still Pending or Under Negotiation)
router.delete('/proposals/:id', async (req, res) => {
    try {
        const proposal = await CustomerProduceProposal.findById(req.params.id);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }
        if (proposal.status === 'Accepted') {
            return res.status(400).json({ success: false, message: 'Cannot delete an already accepted proposal' });
        }

        await CustomerProduceProposal.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Proposal deleted successfully' });
    } catch (error) {
        console.error('Error deleting proposal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. Fetch pending C2B acquisition orders for the customer
// 3. Fetch pending C2B acquisition orders for the customer
router.get('/orders/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const orders = await C2B_Order.find({ customer_id }).populate('proposal_id').sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching c2b orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 5. Fetch earnings summary
router.get('/earnings/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        
        // Total from completed C2B orders (Released to Customer)
        const orders = await C2B_Order.find({ 
            customer_id, 
            paymentStatus: 'Released to Customer' 
        });
        const totalEarned = orders.reduce((sum, order) => sum + (order.agreedPrice || 0), 0);

        // Total already withdrawn (Approved)
        const withdrawals = await WithdrawalRequest.find({
            userId: customer_id,
            status: 'Approved'
        });
        const totalWithdrawn = withdrawals.reduce((sum, req) => sum + (req.amount || 0), 0);

        // Pending withdrawals
        const pendingWithdrawals = await WithdrawalRequest.find({
            userId: customer_id,
            status: 'Pending'
        });
        const totalPending = pendingWithdrawals.reduce((sum, req) => sum + (req.amount || 0), 0);

        res.status(200).json({
            success: true,
            earnings: {
                totalEarned,
                totalWithdrawn,
                totalPending,
                availableBalance: totalEarned - totalWithdrawn - totalPending
            }
        });
    } catch (error) {
        console.error('Error fetching earnings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 6. Request withdrawal
router.post('/withdraw', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid withdrawal details' });
        }

        // Verify balance again
        const orders = await C2B_Order.find({ 
            customer_id: userId, 
            paymentStatus: 'Released to Customer' 
        });
        const totalEarned = orders.reduce((sum, order) => sum + (order.agreedPrice || 0), 0);

        const withdrawals = await WithdrawalRequest.find({
            userId: userId,
            status: 'Approved'
        });
        const totalWithdrawn = withdrawals.reduce((sum, req) => sum + (req.amount || 0), 0);
        
        const pendingWithdrawals = await WithdrawalRequest.find({
            userId: userId,
            status: 'Pending'
        });
        const totalPending = pendingWithdrawals.reduce((sum, req) => sum + (req.amount || 0), 0);
        
        const available = totalEarned - totalWithdrawn - totalPending;

        if (amount > available) {
            return res.status(400).json({ success: false, message: 'Insufficient balance (considering pending requests)' });
        }

        const newRequest = new WithdrawalRequest({
            userId,
            amount,
            status: 'Pending'
        });

        await newRequest.save();

        // Notify Administrator
        try {
            await Notification.create({
                title: 'New Withdrawal Request',
                message: `Grower (ID: ${userId}) has requested a withdrawal of ₹${amount}.`,
                type: 'warning',
                metadata: { withdrawalId: newRequest._id, userId }
            });
        } catch (nError) {
            console.error('Failed to create notification:', nError);
        }

        res.status(201).json({ success: true, message: 'Withdrawal request submitted', request: newRequest });
    } catch (error) {
        console.error('Error requesting withdrawal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 7. Get withdrawal history
router.get('/withdrawals/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        const withdrawals = await WithdrawalRequest.find({ userId: customer_id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, withdrawals });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 8. Delete/Cancel withdrawal request (Only if Pending)
router.delete('/withdraw/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await WithdrawalRequest.findById(requestId);
        
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        if (request.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled' });

        await WithdrawalRequest.findByIdAndDelete(requestId);
        res.status(200).json({ success: true, message: 'Withdrawal request cancelled' });
    } catch (error) {
        console.error('Error cancelling withdrawal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

