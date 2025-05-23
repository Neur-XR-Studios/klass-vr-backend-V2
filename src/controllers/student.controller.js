const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { studentService } = require('../services');

const createStudent = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const student = await studentService.createStudent(req.body, schoolId);
  res.status(httpStatus.CREATED).send(student);
});

const getStudents = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await studentService.queryStudents(filter, options, schoolId);
  res.send(result);
});

const getStudent = catchAsync(async (req, res) => {
  const student = await studentService.getStudentById(req.params.studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }
  res.send(student);
});

const updateStudent = catchAsync(async (req, res) => {
  const student = await studentService.updateStudentById(req.params.studentId, req.body);
  res.send(student);
});

const deleteStudent = catchAsync(async (req, res) => {
  await studentService.deleteStudentById(req.params.studentId);
  res.status(httpStatus.NO_CONTENT).send();
});

const exportStudents = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { gradeId, sectionId } = req.body;

  const fileBuffer = await studentService.exportStudentsToExcel(gradeId, sectionId, schoolId);

  res.setHeader('Content-disposition', 'attachment; filename=students.xlsx');
  res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  res.send(fileBuffer);
});

const importStudentsFromExcel = catchAsync(async (req, res) => {
  const { gradeId, sectionId } = req.body;
  const fileBuffer = req.file.buffer;
  const schoolId = req.user.schoolId;
  await studentService.importStudentsFromExcel(gradeId, sectionId, fileBuffer, schoolId);

  res.status(httpStatus.CREATED).send({ message: 'Students imported successfully' });
});

const searchStudentsBySectionAndGrade = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { sectionId, gradeId } = req.body;
  const students = await studentService.searchStudentsBySectionAndGrade(sectionId, gradeId, schoolId);
  res.status(httpStatus.OK).json(students);
});

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  exportStudents,
  importStudentsFromExcel,
  searchStudentsBySectionAndGrade,
};
