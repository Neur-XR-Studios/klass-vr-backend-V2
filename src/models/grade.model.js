const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const gradeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    schoolId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'School',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Static method to check if a grade name is already taken
gradeSchema.statics.isNameTaken = async function (name) {
  const grade = await this.findOne({ name });
  return !!grade; 
};

gradeSchema.plugin(toJSON);
gradeSchema.plugin(paginate);

/**
 * @typedef Grade
 */
const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
