const express = require('express');
const Notification = require('../models/notificationModel');

const router = express.Router();

// Get all notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find();
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new notification
router.post('/notifications', async (req, res) => {
    try {
        const { psoName, ppName, date, time, message } = req.body;
        const newNotification = new Notification({ psoName, ppName, date, time, message });
        const savedNotification = await newNotification.save();
        res.status(201).json(savedNotification);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
