const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { gradeService } = require('../services');

const createGrade = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const grade = await gradeService.createGrade(req.body, schoolId);
  res.status(httpStatus.CREATED).send(grade);
});

const getGrades = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await gradeService.queryGrades(filter, options, schoolId);
  res.send(result);
});

const getGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.getGradeById(req.params.gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  res.send(grade);
});

const updateGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.updateGradeById(req.params.gradeId, req.body);
  res.send(grade);
});

const deleteGrade = catchAsync(async (req, res) => {
  await gradeService.deleteGradeById(req.params.gradeId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createGrade,
  getGrades,
  getGrade,
  updateGrade,
  deleteGrade,
};
