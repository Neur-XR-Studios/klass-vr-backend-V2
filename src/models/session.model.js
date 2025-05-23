const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

// Define SessionStatus enum within the same file
const SessionStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const sessionSchema = mongoose.Schema(
  {
    sessionId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
    },
    sessionTimeAndDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => validator.isDate(value),
        message: 'Invalid sessionTimeAndDate',
      },
    },
    sessionStartedTime: {
      type: Date,
      validate: {
        validator: (value) => !value || validator.isDate(value),
        message: 'Invalid sessionStartedTime',
      },
    },
    sessionEndedTime: {
      type: Date,
      validate: {
        validator: (value) => !value || validator.isDate(value),
        message: 'Invalid sessionEndedTime',
      },
    },
    grade: {
      type: String,
      validate: {
        validator: (value) => validator.isLength(value, { min: 1 }),
        message: 'Grade must not be empty',
      },
    },
    sessionStatus: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.PENDING,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subject: {
      type: String,
      validate: {
        validator: (value) => validator.isLength(value, { min: 1 }),
        message: 'Subject must not be empty',
      },
    },
    feedback: {
      type: String,
    },
    sessionDuration: {
      type: Number,
    },
    isDeployed: {
      type: Boolean,
      default: false,
    },
    stepperNo: {
      type: Number,
      default: 1,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
sessionSchema.plugin(toJSON);
sessionSchema.plugin(paginate);

function generateRandom6DigitNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique session ID using UUID
 */
sessionSchema.pre('save', function (next) {
  if (!this.sessionId) {
    // Generate a unique 6-digit session ID
    this.sessionId = generateRandom6DigitNumber();
  }
  next();
});

/**
 * @typedef Session
 */
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
