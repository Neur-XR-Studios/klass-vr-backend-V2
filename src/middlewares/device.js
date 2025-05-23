const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");
const { Device, School } = require("../models");

const verifyDevice = async (req) => {
  const deviceId = req.headers["device-id"];
  if (!deviceId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Device ID is required");
  }

  const device = await Device.findOne({ deviceID: deviceId });
  if (!device) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Unauthorized: Device not found"
    );
  }

  req.device = device;

  // Check if the associated school's subscription is active
  if (device.schoolId) {
    try {
      const school = await School.findById(device.schoolId);
      if (!school || !school.isSubscribed) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Subscription ended");
      }
    } catch (error) {
      logger.error("Error checking school subscription:", error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error checking school subscription"
      );
    }
  }
};

const deviceAuth = async (req, res, next) => {
  try {
    await verifyDevice(req);
    next();
  } catch (error) {
    logger.error("Error verifying device:", error);
    next(error);
  }
};

module.exports = deviceAuth;
