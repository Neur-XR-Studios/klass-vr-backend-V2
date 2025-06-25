const mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const answerSchema = mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Assessment',
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const studentPerformanceSchema = mongoose.Schema({
  studentID: {
    type: String,
    required: true,
  },
  experienceConductedID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ExperienceConducted',
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'School',
  },
  sectionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
  },
  gradeID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  answer: answerSchema,
});

studentPerformanceSchema.plugin(aggregatePaginate);

/**
 * @typedef StudentPerformance
 */
const StudentPerformance = mongoose.model('StudentPerformance', studentPerformanceSchema);

module.exports = StudentPerformance;
