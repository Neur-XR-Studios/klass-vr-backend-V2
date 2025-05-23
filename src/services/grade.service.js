const httpStatus = require("http-status");
const { Grade } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a grade
 * @param {Object} gradeBody
 * @returns {Promise<Grade>}
 */
const createGrade = async (gradeBody, schoolId) => {
  gradeBody.schoolId = schoolId;
  return Grade.create(gradeBody);
};

/**
 * Query for grades
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryGrades = async (filter, options, schoolId) => {
  filter.schoolId = schoolId;
  const grades = await Grade.find({ schoolId });
  return grades;
};

/**
 * Get grade by id
 * @param {ObjectId} id
 * @returns {Promise<Grade>}
 */
const getGradeById = async (id) => {
  return Grade.findById(id);
};

/**
 * Update grade by id
 * @param {ObjectId} gradeId
 * @param {Object} updateBody
 * @returns {Promise<Grade>}
 */
const updateGradeById = async (gradeId, updateBody) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not found");
  }
  Object.assign(grade, updateBody);
  await grade.save();
  return grade;
};

/**
 * Delete grade by id
 * @param {ObjectId} gradeId
 * @returns {Promise<Grade>}
 */
const deleteGradeById = async (gradeId) => {
  const grade = await Grade.findByIdAndDelete(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not found");
  }
  return grade;
};

module.exports = {
  createGrade,
  queryGrades,
  getGradeById,
  updateGradeById,
  deleteGradeById,
};
