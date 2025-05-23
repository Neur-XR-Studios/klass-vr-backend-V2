const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { assessmentService } = require("../services");

const createAssessment = catchAsync(async (req, res) => {
  const teacherId = req.user.id;
  const schoolId = req.user.schoolId;
  const sessionId = req.query.sessionId;
  const Assessment = await assessmentService.createAssessment(
    req.body,
    teacherId,
    sessionId,
    schoolId
  );
  res.status(httpStatus.CREATED).send(Assessment);
});

const getAssessments = catchAsync(async (req, res) => {
  const result = await assessmentService.queryAssessment();
  res.send(result);
});

const getAssessment = catchAsync(async (req, res) => {
  const Assessment = await assessmentService.getAssessmentById(
    req.params.assessmentId
  );

  if (!Assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  }
  res.send(Assessment);
});

const updateAssessment = catchAsync(async (req, res) => {
  const sessionId = req.query.sessionId;
  const userId = req.user.id;
  const assessments = await assessmentService.updateAssessmentById(
    sessionId,
    req.body,
    userId
  );
  res.send(assessments);
});

const deleteAssessment = catchAsync(async (req, res) => {
  await assessmentService.deleteAssessmentById(req.params.assessmentId);
  res.status(httpStatus.OK).send();
});

module.exports = {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
};
