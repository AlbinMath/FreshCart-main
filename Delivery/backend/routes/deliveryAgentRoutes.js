const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DeliveryAgent = require('../models/DeliveryAgent');
const Schedule = require('../models/Schedule');

const router = express.Router();

// --- Scheduling Routes ---

// Get Schedule for an Agent
router.get('/schedule/:agentId', async (req, res) => {
    try {
        const schedules = await Schedule.find({ agentId: req.params.agentId });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save/Update Schedule
router.post('/schedule', async (req, res) => {
    const { agentId, date, slots } = req.body;
    try {
        // Upsert: Update if exists, otherwise create
        const schedule = await Schedule.findOneAndUpdate(
            { agentId, date },
            { slots },
            { new: true, upsert: true }
        );
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find agent by email
        const agent = await DeliveryAgent.findOne({ email });
        if (!agent) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, agent.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign(
            { id: agent._id, email: agent.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            agent: {
                id: agent._id,
                fullName: agent.fullName,
                email: agent.email,
                status: agent.status,
                contactNumber: agent.contactNumber,
                dateOfBirth: agent.dateOfBirth,
                residentialAddress: agent.residentialAddress,
                pinCode: agent.pinCode,
                vehicleRegistrationNumber: agent.vehicleRegistrationNumber,
                bankAccountNumber: agent.bankAccountNumber,
                ifscCode: agent.ifscCode,
                upiId: agent.upiId,
                accountHolderName: agent.accountHolderName
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/check-user', async (req, res) => {
    try {
        const { contactNumber } = req.body;
        const agent = await DeliveryAgent.findOne({ contactNumber });

        if (!agent) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User found' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { contactNumber, newPassword } = req.body;

        const agent = await DeliveryAgent.findOne({ contactNumber });
        if (!agent) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        agent.passwordHash = await bcrypt.hash(newPassword, salt);
        await agent.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
