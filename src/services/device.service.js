const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { Device, School } = require("../models");

/**
 * Create a device record.
 * @param {Object} deviceData - The request body with device data.
 * @returns {Promise<Device>}
 */
async function createDevice(deviceData) {
  const schoolSecretId = deviceData.schoolID;
  const deviceId = deviceData.deviceID;
  const school = await School.findOne({
    vrDeviceRegisterSecret: schoolSecretId,
  });

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found!!");
  }

  const vrDeviceRegisterSecret = school.vrDeviceRegisterSecret;
  const isDeviceIdQuery = await Device.findOne({ deviceID: deviceId });
  const deviceIdExists = !!isDeviceIdQuery;

  if (schoolSecretId !== vrDeviceRegisterSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid school secret ID");
  }

  if (deviceIdExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Device already registered");
  }

  const countDevices = await Device.countDocuments({ schoolID: school._id });
  const maxAllowedDevices = school.maxAllowedDevice;
  if (countDevices >= maxAllowedDevices) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Maximum device limit exceeded for this school"
    );
  }

  const uniqueID = ("00" + (countDevices + 1)).slice(-2);

  deviceData.schoolID = school._id;
  const device = new Device({ ...deviceData, uniqueID });
  await device.save();

  return { code: 200, message: "Device created successfully", device };
}

/**
 * Update an existing device record.
 *
 * @param {String} deviceId - The ID of the device to update.
 * @param {Object} updateData - The new device data.
 * @returns {Promise<Object>} - The updated device document.
 */
const updateDeviceById = async (deviceId, updateData, schoolId) => {
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, "Device not found");
  }

  const school = await School.findById(schoolId);
  if (!school) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "School not found for this device"
    );
  }

  // Get the highest uniqueID currently in use for the school
  const highestUniqueIDDevice = await Device.findOne({ schoolID: schoolId })
    .sort({ uniqueID: -1 })
    .exec();

  const highestUniqueID = parseInt(highestUniqueIDDevice.uniqueID, 10);

  // Check if the new uniqueID is valid
  if (updateData.uniqueID) {
    const newUniqueID = parseInt(updateData.uniqueID, 10);

    if (newUniqueID > highestUniqueID) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Unique ID cannot exceed ${highestUniqueID}`
      );
    }

    const uniqueIdExists = await Device.findOne({
      schoolID: schoolId,
      uniqueID: updateData.uniqueID,
    });

    if (uniqueIdExists && uniqueIdExists._id.toString() !== deviceId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Unique ID already in use within this school"
      );
    }
  }

  Object.keys(updateData).forEach((field) => {
    device[field] = updateData[field];
  });

  await device.save();
  return device;
};

/**
 * Query devices based on provided filters and options.
 * @param {Object} filter - Filter criteria.
 * @param {Object} options - Query options.
 * @returns {Promise<Array<Device>>} - Array of devices.
 */
const queryDevices = async (filter, options, schoolId) => {
  console.log("schoolId:", schoolId);
  filter.schoolID = schoolId;
  const devices = await Device.find(filter)
    .sort(options.sortBy)
    .limit(parseInt(options.limit))
    .skip(parseInt(options.page) * parseInt(options.limit));
  return devices;
};

/**
 * Get a device by its ID.
 * @param {String} deviceId - The ID of the device.
 * @returns {Promise<Device>} - The device document.
 */
const getDeviceById = async (deviceId) => {
  return Device.findById(deviceId);
};

/**
 * Delete a device by its ID.
 * @param {String} deviceId - The ID of the device to delete.
 * @returns {Promise<void>}
 */
const deleteDeviceById = async (deviceId) => {
  const device = await Device.findByIdAndDelete(deviceId);
  if (!device) {
    throw new ApiError("Device not found", 404);
  }
};

module.exports = {
  createDevice,
  queryDevices,
  getDeviceById,
  updateDeviceById,
  deleteDeviceById,
};
