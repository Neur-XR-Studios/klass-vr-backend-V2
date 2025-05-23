const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { User } = require('../models');

const createUser = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const user = await userService.createUser(req.body, schoolId);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options, schoolId);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getTeacher = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;

  console.log('schoolId : ', schoolId);
  const users = await User.find({ schoolId, role: 'teacher' });
  res.status(httpStatus.OK).send(users);
});

const updateUserProfile = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUserProfile(req);
  res.status(httpStatus.OK).send(updatedUser);
});

const importTeacherFromExcel = catchAsync(async (req, res) => {
  const fileBuffer = req.file.buffer;
  const schoolId = req.user.schoolId;
  const userId = req.user.id;
  await userService.importTeachersFromExcel(fileBuffer, schoolId, userId);

  res.status(httpStatus.CREATED).send({ message: 'Teachers imported successfully' });
});

const exportTeachers = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;

  const fileBuffer = await userService.exportTeacherToExcel(schoolId);

  res.setHeader('Content-disposition', 'attachment; filename=teacher.xlsx');
  res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  res.send(fileBuffer);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getTeacher,
  updateUserProfile,
  importTeacherFromExcel,
  exportTeachers
};
