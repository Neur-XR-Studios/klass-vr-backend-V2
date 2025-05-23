const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
  deviceID: {
    type: String,
    required: true,
    unique: true,
  },
  schoolID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
  uniqueID: {
    type: String,
    required: true,
  },
  lastActivity: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  lastUsedIP: {
    type: String,
  },
});

// Create a compound unique index on deviceID and schoolID
deviceSchema.index({ deviceID: 1, schoolID: 1 }, { unique: true });

/**
 * @typedef Device
 */
const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
