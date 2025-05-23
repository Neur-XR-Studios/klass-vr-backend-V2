const mongoose = require("mongoose");

const liveControlSchema = mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    isStop: {
      type: Boolean,
      default: false,
    },
    isStart: {
      type: Boolean,
      default: false,
    },
    experienceId: {
      type: String,
    },
    gradeId: {
      type: String,
    },
    sectionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef LiveControl
 */
const LiveControl = mongoose.model("liveControl", liveControlSchema);

module.exports = LiveControl;
