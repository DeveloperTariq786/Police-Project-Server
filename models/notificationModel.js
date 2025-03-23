const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    psoName: { type: String, required: true },
    ppName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now } // Add createdAt field
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
