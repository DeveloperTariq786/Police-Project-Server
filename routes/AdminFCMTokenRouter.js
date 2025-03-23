const express = require('express');
const router = express.Router();
const FCMToken = require('../models/AdminFCMTokenModel'); // Adjust the path as needed

// POST route to add or update an FCM token
router.post('/', async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const result = await FCMToken.findOneAndUpdate(
      { fcmToken: fcmToken },
      { fcmToken: fcmToken },
      { new: true, upsert: true }
    );

    const isNewToken = result.isNew;

    res.status(isNewToken ? 201 : 200).json({
      message: isNewToken ? 'FCM token added successfully' : 'FCM token updated successfully',
      token: result
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing FCM token', error: error.message });
  }
});


module.exports = router;