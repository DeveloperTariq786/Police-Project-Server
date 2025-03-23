const express = require('express');
const router = express.Router();
const LivePPModel = require('../models/livePPModel');
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// GET all live PPs
router.get('/livePP', async (req, res) => {
  try {
    const livePPs = await LivePPModel.find(); // Simply find all LivePP documents
    res.json(livePPs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific live PP by beltNumber
router.get('/livePP/:beltNumber', async (req, res) => {
  try {
    const livePP = await LivePPModel.findOne({ beltNumber: req.params.beltNumber }).populate('psos');
    if (!livePP) {
      return res.status(404).json({ message: 'Live PP not found' });
    }
    res.json(livePP);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new live PP
router.post('/', async (req, res) => {
  const { beltNumber, name, radius, assignedPSOs } = req.body; // Use 'assignedPSOs' instead of 'psos'

  const newLivePP = new LivePPModel({
    beltNumber,
    name,
    radius,
    assignedPSOs,
  });

  try {
    const savedLivePP = await newLivePP.save();
    res.status(201).json(savedLivePP);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// POST to add multiple PSOs to the assignedPSOs field
router.post('/:beltNumber', async (req, res) => {
  const { assignedPSOs } = req.body;

  if (!Array.isArray(assignedPSOs) || assignedPSOs.length === 0) {
    return res.status(400).send('Invalid request');
  }
  try {
    const livePP = await LivePPModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber },
      { $push: { assignedPSOs: { $each: assignedPSOs } } },
      { new: true, upsert: true }
    );
    if (!livePP) {
      return res.status(404).json({ message: 'Live PP not found' });
    }
    res.status(200).json(livePP);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update a specific live PP by beltNumber
router.put('/livePP/:beltNumber', async (req, res) => {
  try {
    const { assignedPSOs } = req.body; // Get the updated assignedPSOs array

    const updatedLivePP = await LivePPModel.findOneAndUpdate(
      { beltNumber: req.params.beltNumber },
      { $set: { assignedPSOs: assignedPSOs } }, // Update assignedPSOs
      { new: true }
    ).populate('assignedPSOs'); // Populate assignedPSOs

    if (!updatedLivePP) {
      return res.status(404).json({ message: 'Live PP not found' });
    }

    res.json(updatedLivePP);
  } catch (err) {
    console.error('Error updating Live PP:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE a specific live PP by beltNumber
router.delete('/livePP/:beltNumber', async (req, res) => {
  try {
    const result = await LivePPModel.deleteOne({ beltNumber: req.params.beltNumber });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Live PP not found' });
    }
    res.json({ message: 'Live PP deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// DELETE an assigned PSO from a specific live PP by beltNumber and PSO ID
router.delete('/livePP/:beltNumber/assignedPSO/:id', async (req, res) => {
  const { beltNumber,id } = req.params;

  try {
    const livePP = await LivePPModel.findOneAndUpdate(
      { beltNumber },
      { $pull: { assignedPSOs: { id: id } } },
      { new: true }
    );

    if (!livePP) {
      return res.status(404).json({ message: 'Live PP not found' });
    }

    res.json(livePP);
  } catch (err) {
    console.error('Error deleting assigned PSO:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
