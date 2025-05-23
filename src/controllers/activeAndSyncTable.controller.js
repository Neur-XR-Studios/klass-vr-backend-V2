const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { activeAndSyncTableService } = require('../services');
const ApiError = require('../utils/ApiError');
const { liveControl, Device } = require('../models');

const provokeActiveAndSync = catchAsync(async (req, res) => {
  const teacherId = req.user.id;
  const schoolId = req.user.schoolId;
  const activeAndSyncTable = await activeAndSyncTableService.provokeActiveAndSync(teacherId, schoolId);
  res.status(httpStatus.CREATED).send({ message: activeAndSyncTable });
});

const revokeActiveAndSync = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const resultMessage = await activeAndSyncTableService.revokeActiveAndSync(schoolId);
  res.status(httpStatus.OK).send({ message: resultMessage });
});

const getActiveAndSyncTables = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ['deviceId', 'isActive', 'isSynced']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const activeAndSyncTables = await activeAndSyncTableService.queryActiveAndSyncTables(filter, options, schoolId);
  res.send(activeAndSyncTables);
});

const updateActiveAndSyncTable = catchAsync(async (req, res) => {
  const deviceId = req.headers['device-id'];
  const activeAndSyncTables = await activeAndSyncTableService.updateActiveAndSyncTableById(deviceId, req.body);
  res.send(activeAndSyncTables);
});

const updateStartStop = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const activeAndSyncTables = await activeAndSyncTableService.updateStartStop(schoolId, req);
  res.send(activeAndSyncTables);
});

const liveTrack = catchAsync(async (req, res) => {
  const deviceId = req.headers['device-id'];
  const school = await Device.find({ deviceID: deviceId });
  if (!school) {
    throw new ApiError('No live classes found.', 400);
  }
  const getDeviceStatus = await liveControl.find({
    schoolId: school[0].schoolID,
  });
  res.send(getDeviceStatus);
});

module.exports = {
  provokeActiveAndSync,
  revokeActiveAndSync,
  getActiveAndSyncTables,
  updateActiveAndSyncTable,
  updateStartStop,
  liveTrack,
};
