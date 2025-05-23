const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const studentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    schoolId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'School',
      required: true,
    },
    sectionId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Section',
    },
    gradeId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Grade',
    },
  },
  {
    timestamps: true,
  },
);

// Adding plugins for JSON conversion and pagination
studentSchema.plugin(toJSON);
studentSchema.plugin(paginate);

/**
 * @typedef Student
 */
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
