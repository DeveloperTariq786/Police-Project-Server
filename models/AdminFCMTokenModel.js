const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
  fcmToken: {
    type: String,
    required: true,
      unique: true,
    trim: true
  }
});

const FCMToken = mongoose.model('AdminFCMToken', fcmTokenSchema);

module.exports = FCMToken;