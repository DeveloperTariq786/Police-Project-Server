const mongoose = require('mongoose');

const confirmedPPSchema = new mongoose.Schema({
  beltNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  isPP: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model('ConfirmedPP', confirmedPPSchema);
