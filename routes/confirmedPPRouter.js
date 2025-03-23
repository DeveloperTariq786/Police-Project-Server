const express = require('express');
const router = express.Router();
const ConfirmedPPModel = require('../models/ConfirmedPPModel');
const bodyParser = require('body-parser');
router.use(bodyParser.json());

// GET all confirmed PPs
router.get('/confirmedPP', async (req, res) => {
  try {
    const confirmedPPs = await ConfirmedPPModel.find();
    res.json(confirmedPPs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific confirmed PP by beltNumber
router.get('/confirmedPP/:beltNumber', async (req, res) => {
  try {
    const confirmedPP = await ConfirmedPPModel.findOne({ beltNumber: req.params.beltNumber });
    if (!confirmedPP) {
      return res.status(404).json({ message: 'Confirmed PP not found' });
    }
    res.json(confirmedPP);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new confirmed PP
router.post('/', async (req, res) => {
  const { beltNumber, name, phoneNumber, isPP } = req.body;

  const newConfirmedPP = new ConfirmedPPModel({
    beltNumber,
    name,
    phoneNumber,
    isPP,
  });

  try {
    const savedConfirmedPP = await newConfirmedPP.save();
    res.status(201).json(savedConfirmedPP);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT to update a specific confirmed PP by beltNumber
router.put('/confirmedPP/:beltNumber', async (req, res) => {
  try {
    const updatedConfirmedPP = await ConfirmedPPModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber },
      { $set: req.body },
      { new: true }
    );
    if (!updatedConfirmedPP) {
      return res.status(404).json({ message: 'Confirmed PP not found' });
    }
    res.json(updatedConfirmedPP);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a specific confirmed PP by beltNumber
router.delete('/confirmedPP/:beltNumber', async (req, res) => {
  try {
    const result = await ConfirmedPPModel.deleteOne({ beltNumber: req.params.beltNumber });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Confirmed PP not found' });
    }
    res.json({ message: 'Confirmed PP deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
