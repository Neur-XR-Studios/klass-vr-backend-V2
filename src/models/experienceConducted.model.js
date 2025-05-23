const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const experienceConductedSchema = mongoose.Schema(
  {
    sessionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    teacherID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    classStartTime: {
      type: Date,
    },
    classEndTime: {
      type: Date,
    },
    totalStudentsAttended: {
      type: Number,
    },
    schoolID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    conductedDate: {
      type: Date,
      default: Date.now,
    },
    totalDevicesActive: {
      type: Number,
    },
    classConductedHours: {
      type: String,
    },
    feedback: {
      type: String,
    },
    sectionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    gradeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
    },
  },
  {
    timestamps: true,
  }
);

experienceConductedSchema.plugin(toJSON);
experienceConductedSchema.plugin(paginate);

/**
 * @typedef ExperienceConducted
 */
const ExperienceConducted = mongoose.model(
  "ExperienceConducted",
  experienceConductedSchema
);

module.exports = ExperienceConducted;
