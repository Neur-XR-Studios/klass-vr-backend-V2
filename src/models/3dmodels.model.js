const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const model3DSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  tags: [
    {
      type: String,
    },
  ],
  modelUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: false,
  },
  createdBy: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
  userRole: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
model3DSchema.plugin(toJSON);
model3DSchema.plugin(paginate);
const Model = mongoose.model('model', model3DSchema);

module.exports = Model;
