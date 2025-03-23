const mongoose = require('mongoose');

const livePPSchema = new mongoose.Schema({
  beltNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  radius: {
    type: Number,
    required: true,
  },
  assignedPSOs: [
    {
      name: {
        type: String,
        required: true
      },
      id: {
        type: String,
        required: true
      }
    }
  ],
});

module.exports = mongoose.model('LivePP', livePPSchema);