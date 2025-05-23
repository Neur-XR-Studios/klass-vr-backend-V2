const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const sectionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gradeId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Grade',
      required: true,
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

sectionSchema.plugin(toJSON);
sectionSchema.plugin(paginate);

/**
 * @typedef Section
 */
const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;
