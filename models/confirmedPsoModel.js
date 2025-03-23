const mongoose = require('mongoose');

const confirmedPsoSchema = new mongoose.Schema({
  beltNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
    required: true,
  },
  isAssigned: {
    type: Boolean,
    default: false,
  },
  isPSO: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('ConfirmedPso', confirmedPsoSchema);
