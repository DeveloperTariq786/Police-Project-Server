const express = require('express');
const router = express.Router();
const ConfirmedPsoModel = require('../models/confirmedPsoModel');
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// GET all confirmed PSOs
router.get('/confirmedPso', async (req, res) => {
  try {
    const confirmedPso = await ConfirmedPsoModel.find();
    res.json(confirmedPso);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific confirmed PSO by beltNumber
router.get('/confirmedPso/:beltNumber', async (req, res) => {
  try {
    const confirmedPso = await ConfirmedPsoModel.findOne({ beltNumber: req.params.beltNumber });
    if (!confirmedPso) {
      return res.status(404).json({ message: 'Confirmed PSO not found' });
    }
    res.json(confirmedPso);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new confirmed PSO
router.post('/', async (req, res) => {
  const { beltNumber, name, mobileNumber, designation, organization, isAssigned, isPSO } = req.body;

  const newConfirmedPso = new ConfirmedPsoModel({
    beltNumber,
    name,
    mobileNumber,
    designation,
    organization,
    isAssigned,
    isPSO,
  });

  try {
    const savedConfirmedPso = await newConfirmedPso.save();
    res.status(201).json(savedConfirmedPso);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/isAssigned/:beltNumber', async (req, res) => {
  try {
    const { isAssigned } = req.body; // Get the updated isAssigned value from request body

    const updatedPso = await ConfirmedPsoModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber }, // Find the document by beltNumber
      { $set: { isAssigned: isAssigned } }, // Update the isAssigned field
      { new: true }
    );

    if (!updatedPso) {
      return res.status(404).json({ message: 'Confirmed PSO not found' });
    }

    res.json(updatedPso);
  } catch (err) {
    console.error('Error updating Confirmed PSO:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE a specific confirmed PSO by beltNumber
router.delete('/DeleteConfirmedPso/:beltNumber', async (req, res) => {
  try {
    const result = await ConfirmedPsoModel.deleteOne({ beltNumber: req.params.beltNumber });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Confirmed PSO not found' });
    }
    res.json({ message: 'Confirmed PSO deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
