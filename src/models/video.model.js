const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const videoSchema = new mongoose.Schema({
  videoURL: {
    type: String,
    required: true,
  },
  resolution: {
    type: String,
    required: true,
  },
  frameRate: {
    type: String,
    required: true,
  },
  bitrate: {
    type: Number,
    required: true,
  },
  codec: {
    type: String,
    required: true,
  },
  aspectRatio: {
    type: String,
  },
  audioInformation: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tags: {
    type: [String],
  },
  duration: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
  },
  typeOfVideo: {
    type: String,
    enum: ['stereoscopic-side-to-side', 'stereoscopic-top-to-bottom', 'monoscopic'],
  },
});
videoSchema.plugin(toJSON);
videoSchema.plugin(paginate);
const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
