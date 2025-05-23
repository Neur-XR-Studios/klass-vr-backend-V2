const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const answerSchema = mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => {
        return value.trim().length > 0;
      },
      message: "Option text must not be empty",
    },
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const assessmentSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
      validate(value) {
        if (value.trim().length === 0) {
          throw new Error("Question must not be empty");
        }
      },
    },
    options: {
      type: [answerSchema],
      validate: {
        validator: (options) => {
          return options.some((option) => option.isCorrect);
        },
        message: "At least one option must be marked as correct",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    updatedAt: {
      type: Date,
    },
    typeOfGame: {
      type: String,
      enum: ["Archery", "Basketball", "MCQ"],
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "School",
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.plugin(toJSON);
assessmentSchema.plugin(paginate);

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;
