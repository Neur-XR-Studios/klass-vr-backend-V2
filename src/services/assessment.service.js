const httpStatus = require('http-status');
const { Assessment } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a assesments
 * @param {Object} assesmentBody
 * @param {ObjectId} teacherId
 * @returns {Promise<Assessment>}
 */
const createAssessment = async (assessmentBodies, teacherId, sessionId, schoolId) => {
  const assessments = await Promise.all(
    assessmentBodies.map(async (assessmentBody) => {
      const assessment = new Assessment({
        ...assessmentBody,
        sessionId,
        schoolId,
        createdBy: teacherId,
      });
      return assessment.save();
    }),
  );

  return assessments;
};

/**
 * Query for assesments
 * @returns {Promise<QueryResult>}
 */
const queryAssessment = async () => {
  const assessments = await Assessment.find().populate('createdBy').populate('sessionId').exec();
  return assessments;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<Assessment>}
 */
const getAssessmentById = async (id) => {
  return Assessment.findById(id);
};

/**
 * Update user by id
 * @param {ObjectId} assessmentId
 * @param {Object} updateBody
 * @returns {Promise<Assessment>}
 */
/**
 * Update assessments by IDs
 * @param {Array} assessmentIds
 * @param {Array} updateBodies
 * @returns {Promise<Array>}
 */
const updateAssessmentById = async (sessionId, updateBodies, userId) => {
  if (!Array.isArray(updateBodies) || updateBodies.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid update bodies');
  }

  const updatedAssessments = [];

  const assessmentIdsToUpdate = [];

  for (const updateBody of updateBodies) {
    const { id, question, options, isDraft, typeOfGame } = updateBody;

    // If assessmentId is provided, update the existing assessment
    if (id) {
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, `Assessment with ID ${id} not found`);
      }

      // Update the assessment properties
      assessment.question = question;
      assessment.options = options;
      assessment.isDraft = isDraft;
      assessment.typeOfGame = typeOfGame;
      assessment.sessionId = sessionId;

      await assessment.save();
      updatedAssessments.push(assessment);
      assessmentIdsToUpdate.push(id);
    } else {
      // If assessmentId is not provided, create a new assessment
      const newAssessment = new Assessment({
        question,
        options,
        isDraft,
        typeOfGame,
        sessionId,
        createdBy: userId,
      });
      const savedAssessment = await newAssessment.save();
      updatedAssessments.push(savedAssessment);
      assessmentIdsToUpdate.push(savedAssessment._id);
    }
  }

  // Remove assessments that are not included in the updateBodies
  const assessmentsToRemove = await Assessment.find({ sessionId, _id: { $nin: assessmentIdsToUpdate } });
  await Promise.all(
    assessmentsToRemove.map(async (assessment) => {
      await Assessment.findByIdAndDelete(assessment._id);
    }),
  );

  return updatedAssessments;
};

/**
 * Delete user by id
 * @param {ObjectId} assessmentIdd
 * @returns {Promise<Assessment>}
 */
const deleteAssessmentById = async (assessmentId) => {
  const assesment = await getAssessmentById(assessmentId);
  await Assessment.findByIdAndDelete(assessmentId);
  if (!assesment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'assessment not found');
  }
};

module.exports = {
  createAssessment,
  queryAssessment,
  getAssessmentById,
  updateAssessmentById,
  deleteAssessmentById,
};
