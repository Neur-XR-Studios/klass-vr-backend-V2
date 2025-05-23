const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { schoolService } = require('../services');

const createSchool = catchAsync(async (req, res) => {
  const school = await schoolService.createSchool(req.body);
  res.status(httpStatus.CREATED).send(school);
});

const getAllSchools = catchAsync(async (req, res) => {
  const schools = await schoolService.querySchools();
  res.send(schools);
});

const getSchoolById = catchAsync(async (req, res) => {
  const schoolId = req.params.schoolId;
  const school = await schoolService.getSchoolById(schoolId);
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  }

  res.send(school);
});

const updateSchoolById = catchAsync(async (req, res) => {
  const schoolId = req.params.schoolId;
  const updatedSchool = await schoolService.updateSchoolById(schoolId, req.body);
  res.send(updatedSchool);
});

const deleteSchoolById = catchAsync(async (req, res) => {
  const schoolId = req.params.schoolId;
  await schoolService.deleteSchoolById(schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchoolById,
  deleteSchoolById,
};
