const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { deviceService } = require("../services");

const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body);
  res.status(httpStatus.CREATED).send(device);
});

const getDevices = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const filter = pick(req.query, ["deviceID", "schoolID"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const devices = await deviceService.queryDevices(filter, options, schoolId);
  res.send(devices);
});

const getDeviceById = catchAsync(async (req, res) => {
  const device = await deviceService.getDeviceById(req.params.deviceId);
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, "Device not found");
  }
  res.send(device);
});

const updateDeviceById = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const content = await deviceService.updateDeviceById(
    req.params.deviceId,
    req.body,
    schoolId
  );
  res.send(content);
});

const deleteDeviceById = catchAsync(async (req, res) => {
  await deviceService.deleteDeviceById(req.params.deviceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createDevice,
  getDevices,
  getDeviceById,
  deleteDeviceById,
  updateDeviceById,
};
