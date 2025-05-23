const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const activeAndSyncTableSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isSynced: {
    type: Boolean,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  deviceStarted: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

// add plugin that converts mongoose to json
activeAndSyncTableSchema.plugin(toJSON);
activeAndSyncTableSchema.plugin(paginate);

const ActiveAndSyncTable = mongoose.model('ActiveAndSyncTable', activeAndSyncTableSchema);

module.exports = ActiveAndSyncTable;
