const express = require('express');
const router = express.Router();
const RegisteredUsersModel = require('../models/registeredUsersModel');
const bodyParser = require('body-parser');

router.use(bodyParser.json()); // Ensure body-parser middleware is used

// GET all registered users
router.get('/registeredUsers', async (req, res) => {
  try {
    const registeredUsers = await RegisteredUsersModel.find();
    res.json(registeredUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific registered user by beltNumber
router.get('/registeredUsers/:beltNumber', async (req, res) => {
  try {
    const registeredUser = await RegisteredUsersModel.findOne({ beltNumber: req.params.beltNumber });
    if (!registeredUser) {
      return res.status(404).json({ message: 'RegisteredUser not found' });
    }
    res.json(registeredUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new registered user
router.post('/', async (req, res) => {
  const { beltNumber, name, mobileNumber, designation, organization, isPP, registerAsPP, isAssigned, isPSO, fcmToken } = req.body;

  const newRegisteredUser = new RegisteredUsersModel({
    beltNumber,
    name,
    mobileNumber,
    designation,
    organization,
    isPP,
    registerAsPP,
    isAssigned,
    isPSO,
    fcmToken,
  });

  try {
    const savedRegisteredUser = await newRegisteredUser.save();
    res.status(201).json(savedRegisteredUser);
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate key error
      res.status(400).json({ message: 'Duplicate beltNumber, please use a unique beltNumber.' });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
});



// PUT to update isPP for a specific registered user
router.put('/registeredUsers/:beltNumber', async (req, res) => {
  try {
    const updatedRegisteredUser = await RegisteredUsersModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber },
      { $set: { isPP: req.body.isPP } },
      { new: true }
    );
    if (!updatedRegisteredUser) {
      return res.status(404).json({ message: 'RegisteredUser not found' });
    }
    res.json(updatedRegisteredUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT to update isAssigned for a specific registered user
router.put('/registeredUsers/isAssigned/:beltNumber', async (req, res) => {
  try {
    const updatedRegisteredUser = await RegisteredUsersModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber },
      { $set: { isAssigned: req.body.isAssigned } },
      { new: true }
    );
    if (!updatedRegisteredUser) {
      return res.status(404).json({ message: 'RegisteredUser not found' });
    }
    res.json(updatedRegisteredUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT to update registerAsPP for a specific registered user
router.put('/registeredUsers/isPSO/:beltNumber', async (req, res) => {
  try {
    const updatedRegisteredUser = await RegisteredUsersModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber },
      { $set: { isPSO: req.body.isPSO } },
      { new: true }
    );
    if (!updatedRegisteredUser) {
      return res.status(404).json({ message: 'RegisteredUser not found' });
    }
    res.json(updatedRegisteredUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a specific registered user by beltNumber
router.delete('/registeredUsers/:beltNumber', async (req, res) => {
  try {
    const result = await RegisteredUsersModel.deleteOne({ beltNumber: req.params.beltNumber });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'RegisteredUser not found' });
    }
    res.json({ message: 'RegisteredUser deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
