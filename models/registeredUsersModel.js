const mongoose = require('mongoose');

const registeredUsersSchema = new mongoose.Schema({
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
  },
  organization: {
    type: String,
  },
  isPP: {
    type: Boolean,
    default: false,
  },
  registerAsPP: {
    type: Boolean,
    default: false,
  },
  isAssigned: {
    type: Boolean,
    default: false,
  },
  isPSO: {
    type: Boolean,
    default: false,
  },
  fcmToken: {
    type: String,

  },
});

module.exports = mongoose.model('RegisteredUsers', registeredUsersSchema);
