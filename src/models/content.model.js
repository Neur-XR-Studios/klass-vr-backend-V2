const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const modelDetailSchema = new mongoose.Schema({
  script: {
    type: String,
  },
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "model",
  },
  modelCoordinates: {
    type: String,
  },
  displayTime: {
    type: String,
  },
});

const videoDetailSchema = new mongoose.Schema({
  script: {
    type: String,
  },
  VideoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
  },
  videoSound: {
    type: String,
    enum: ["tts", "mute"],
  },
});

const imageDetailSchema = new mongoose.Schema({
  script: {
    type: String,
  },
  ImageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image360",
  },
  displayTime: {
    type: String,
  },
});

const simulationSchema = new mongoose.Schema({
  script: {
    type: String,
  },
  simulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "simulation",
  },
  displayTime: {
    type: String,
  },
});

const contentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    script: {
      type: String,
    },
    modelDetails: [modelDetailSchema],
    videoDetails: [videoDetailSchema],
    imageDetails: [imageDetailSchema],
    simulationDetails: [simulationSchema],
    teacherCharacterGender: {
      type: String,
      enum: ["male", "female"],
    },
    classEnvironment: {
      type: String,
    },
    youTubeUrl: {
      type: String,
    },
    youTubeVideoAudio: {
      type: Boolean,
    },
    youTubeVideoScript: { type: String },
    youTubeStartTimer: { type: String },
    youTubeEndTimer: { type: String },
    language: {
      type: String,
      enum: ["arabic", "spanish", "english"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    schoolId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "school",
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
contentSchema.plugin(toJSON);
contentSchema.plugin(paginate);

/**
 * @typedef Content
 */
const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
