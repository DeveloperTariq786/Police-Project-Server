const express = require('express');
const router = express.Router();
const LeaveApproval = require('../models/LeaveApprovalModel');

// POST request to create a new leave approval
router.post('/', async (req, res) => {
    const { name, beltNumber, subject, reason, startDate, endDate, appliedDate, isApproved, isDenied, reqextension, reqresumption, extension, resumption, extensionDate, resumptionDate } = req.body;

    try {
        const newLeaveApproval = new LeaveApproval({
            name,
            beltNumber,
            subject,
            reason,
            startDate,
            endDate,
            appliedDate,
            isApproved,
            isDenied,
            reqextension,
            reqresumption,
            extension,
            resumption,
            extensionDate,
            resumptionDate
        });

        const leaveApproval = await newLeaveApproval.save();
        res.status(201).json(leaveApproval);
    } catch (err) {
        if (err.code === 11000) {  // Duplicate key error
            res.status(400).json({ error: 'Duplicate entry: Belt number and start date combination must be unique.' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// GET request to fetch all leave approvals
router.get('/', async (req, res) => {
    try {
        const leaveApprovals = await LeaveApproval.find();
        res.status(200).json(leaveApprovals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET request to fetch leave approvals by belt number
router.get('/User', async (req, res) => {
    try {
        const { beltNumber } = req.query;

        if (beltNumber) {
            const leaveApprovals = await LeaveApproval.find({ beltNumber });
            res.status(200).json(leaveApprovals);
        } else {
            res.status(400).json({ error: 'Belt number is required as a query parameter' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE request to delete a leave approval by belt number and start date
router.delete('/', async (req, res) => {
    try {
        const { beltNumber, startDate } = req.query;

        if (!beltNumber || !startDate) {
            return res.status(400).json({ error: 'Belt number and start date are required as query parameters' });
        }

        const result = await LeaveApproval.findOneAndDelete({ beltNumber, startDate: new Date(startDate) });

        if (result) {
            res.status(200).json({ message: 'Leave approval deleted successfully' });
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update the approval status of a leave approval by belt number and start date
router.put('/status', async (req, res) => {
    try {
        const { beltNumber, startDate, isApproved, isDenied } = req.body;

        if (!beltNumber || !startDate || (isApproved === undefined && isDenied === undefined)) {
            return res.status(400).json({ error: 'Belt number, start date, and approval/denial status are required in the request body' });
        }

        const updateFields = {};
        if (isApproved !== undefined) updateFields.isApproved = isApproved;
        if (isDenied !== undefined) updateFields.isDenied = isDenied;

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            updateFields,
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update the end date of a leave approval by belt number and start date
router.put('/update-enddate', async (req, res) => {
    try {
        const { beltNumber, startDate, endDate } = req.body;

        if (!beltNumber || !startDate || !endDate) {
            return res.status(400).json({ error: 'Belt number, start date, and new end date are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { endDate: new Date(endDate) },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update reqextension of a leave approval by belt number and start date
router.put('/update-reqextension', async (req, res) => {
    try {
        const { beltNumber, startDate, reqextension } = req.body;

        if (!beltNumber || !startDate || reqextension === undefined) {
            return res.status(400).json({ error: 'Belt number, start date, and reqextension are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { reqextension },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update reqresumption of a leave approval by belt number and start date
router.put('/update-reqresumption', async (req, res) => {
    try {
        const { beltNumber, startDate, reqresumption } = req.body;

        if (!beltNumber || !startDate || reqresumption === undefined) {
            return res.status(400).json({ error: 'Belt number, start date, and reqresumption are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { reqresumption },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update extension of a leave approval by belt number and start date
router.put('/update-extension', async (req, res) => {
    try {
        const { beltNumber, startDate, extension } = req.body;

        if (!beltNumber || !startDate || extension === undefined) {
            return res.status(400).json({ error: 'Belt number, start date, and extension are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { extension },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update resumption of a leave approval by belt number and start date
router.put('/update-resumption', async (req, res) => {
    try {
        const { beltNumber, startDate, resumption } = req.body;

        if (!beltNumber || !startDate || resumption === undefined) {
            return res.status(400).json({ error: 'Belt number, start date, and resumption are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { resumption },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update extensionDate of a leave approval by belt number and start date
router.put('/update-extensionDate', async (req, res) => {
    try {
        const { beltNumber, startDate, extensionDate } = req.body;

        if (!beltNumber || !startDate || !extensionDate) {
            return res.status(400).json({ error: 'Belt number, start date, and extensionDate are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { extensionDate: new Date(extensionDate) },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT request to update resumptionDate of a leave approval by belt number and start date
router.put('/update-resumptionDate', async (req, res) => {
    try {
        const { beltNumber, startDate, resumptionDate } = req.body;

        if (!beltNumber || !startDate || !resumptionDate) {
            return res.status(400).json({ error: 'Belt number, start date, and resumptionDate are required in the request body' });
        }

        const leaveApproval = await LeaveApproval.findOneAndUpdate(
            { beltNumber, startDate: new Date(startDate) },
            { resumptionDate: new Date(resumptionDate) },
            { new: true }
        );

        if (leaveApproval) {
            res.status(200).json(leaveApproval);
        } else {
            res.status(404).json({ error: 'Leave approval not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
