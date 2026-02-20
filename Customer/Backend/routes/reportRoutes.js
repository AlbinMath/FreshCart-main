const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const nodemailer = require('nodemailer');

// Configure Nodemailer Transporter
// NOTE: User must provide valid credentials in .env for this to work
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Submit a new report
router.post('/', async (req, res) => {
    try {
        const { userId, userEmail, userName, issueType, orderId, description } = req.body;

        if (!userId || !issueType || !description) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Generate unique alphanumeric Report ID (e.g., RPT-A1B2C)
        const generateReportId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'RPT-';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        const reportId = generateReportId();

        // 1. Save to Database
        const newReport = new Report({
            userId,
            reportId,
            userEmail,
            userName,
            issueType,
            orderId,
            description
        });

        await newReport.save();

        // 2. Send Email Notification to Admin
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self (admin)
            subject: `New Issue Report: ${issueType}`,
            html: `
                <h2>New Issue Reported</h2>
                <p><strong>Report ID:</strong> ${reportId}</p>
                <p><strong>Type:</strong> ${issueType}</p>
                <p><strong>User:</strong> ${userName} (${userEmail})</p>
                <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
                <p><strong>Description:</strong></p>
                <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
                    ${description}
                </blockquote>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            `
        };

        // Try to send email, but don't fail request if email fails (unless critical)
        try {
            await transporter.sendMail(mailOptions);
            console.log('Report email sent successfully');
        } catch (emailError) {
            console.error('Failed to send report email:', emailError);
            // We continue to return success because the DB save was successful
        }

        res.status(201).json({ success: true, message: 'Report submitted successfully', report: newReport });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
