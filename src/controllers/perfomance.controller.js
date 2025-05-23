const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { perfomanceService } = require("../services");

const createPerfomance = catchAsync(async (req, res) => {
  const user = await perfomanceService.createPerfomance(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const searchStudentsBySectionAndGrade = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { sectionId, gradeId } = req.body;
  const students = await perfomanceService.searchStudentsBySectionAndGrade(
    sectionId,
    gradeId,
    schoolId
  );
  res.status(httpStatus.OK).json(students);
});

module.exports = {
  searchStudentsBySectionAndGrade,
  createPerfomance,
};
