const httpStatus = require("http-status");
const { ActiveAndSync, Device, Session, liveControl } = require("../models");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

async function getSessionId(teacherId) {
  const currentTime = new Date();
  const deployedSession = await Session.findOne({
    isDeployed: true,
    sessionStartedTime: { $lt: currentTime },
    teacherId,
  }).exec();
  return deployedSession._id;
}

const provokeActiveAndSync = async (teacherId, schoolId) => {
  try {
    const currentTime = new Date();
    const sessionIdOrMessage = await getSessionId(teacherId);
    console.log("sessionIdOrMessage :", sessionIdOrMessage);
    if (!(sessionIdOrMessage instanceof ObjectId)) {
      return "oops something went wrong";
    }

    const activeDevices = await Device.find({
      schoolID: schoolId,
    });

    for (const device of activeDevices) {
      const existingEntry = await ActiveAndSync.findOne({
        schoolId: device.schoolID,
        deviceId: device.deviceID,
      });

      if (!existingEntry) {
        await ActiveAndSync.create({
          schoolId: device.schoolID,
          deviceId: device.deviceID,
          deviceStarted: currentTime,
          lastActivity: currentTime,
        });
      } else {
        existingEntry.lastActivity = currentTime;
        await existingEntry.save();
      }
    }

    const liveControlActive = await liveControl.create({
      schoolId,
    });

    console.log("Active and Sync entries provoked successfully.");
    return "Active and Sync entries provoked successfully.";
  } catch (error) {
    console.error("Error while provoking Active and Sync entries:", error);
    throw error;
  }
};

const revokeActiveAndSync = async (schoolId) => {
  try {
    await liveControl.deleteMany({ schoolId });
    await ActiveAndSync.deleteMany({ schoolId });
    await Session.updateMany({ schoolId }, { $set: { isDeployed: false } });
    return "Active and Sync entries revoked successfully.";
  } catch (error) {
    throw new ApiError("ActiveAndSyncTable deletion failed", 500);
  }
};
/**
 * Query activeAndSyncTables with pagination and filtering.
 * @param {Object} filter - The filter object for querying activeAndSyncTables.
 * @param {Object} options - The pagination and sorting options.
 * @returns {Promise<Object>} - The paginated and filtered activeAndSyncTables.
 */
const queryActiveAndSyncTables = async (filter, options, schoolId) => {
  filter.schoolId = schoolId;

  const activeAndSyncTablesWithDetails = await ActiveAndSync.aggregate([
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "devices",
        localField: "deviceId",
        foreignField: "deviceID",
        as: "deviceDetails",
      },
    },
    {
      $project: {
        _id: 1,
        schoolId: 1,
        isActive: 1,
        isSynced: 1,
        deviceStarted: 1,
        lastActivity: 1,
        isCompleted: 1,
        deviceId: { $arrayElemAt: ["$deviceDetails.uniqueID", 0] },
      },
    },
  ]);

  return activeAndSyncTablesWithDetails;
};

/**
 * Update an existing activeAndSyncTable record by its ID.
 * @param {string} deviceId - The ID of the activeAndSyncTable to update.
 * @param {Object} updateData - The data to update the activeAndSyncTable with.
 * @returns {Promise<ActiveAndSync>} - The updated activeAndSyncTable record.
 */
const updateActiveAndSyncTableById = async (deviceId, updateData) => {
  try {
    const { isActive, isSynced, deviceStarted, isCompleted, lastActivity } =
      updateData;

    const deviceExist = await ActiveAndSync.find({ deviceId });

    if (!deviceExist || deviceExist.length === 0) {
      return { message: "Experience not yet started", statusCode: 400 };
    }
    updateData.lastActivity = Date.now();
    const activeAndSyncTable = await ActiveAndSync.findOneAndUpdate(
      { deviceId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!activeAndSyncTable) {
      return { message: "ActiveAndSyncTable not found", statusCode: 404 };
    }

    return { data: activeAndSyncTable, statusCode: 200 };
  } catch (error) {
    return { message: "Error updating ActiveAndSyncTable", statusCode: 500 };
  }
};

// const liveStart = async (schoolId) => {
//   try {
//     await ActiveAndSync.deleteMany({ schoolId });
//     return 'Active and Sync entries revoked successfully.';
//   } catch (error) {
//     throw new ApiError('ActiveAndSyncTable deletion failed', error.status || 500);
//   }
// };

const liveStop = async (schoolId) => {
  try {
    await ActiveAndSync.deleteMany({ schoolId });
    await Session.updateMany({ schoolId }, { $set: { isDeployed: false } });
    return "Active and Sync entries revoked successfully.";
  } catch (error) {
    throw new ApiError("ActiveAndSyncTable live failed", error.status || 500);
  }
};

const updateStartStop = async (schoolId, req) => {
  const start = req.body.isStart;
  const stop = req.body.isStop;
  const experienceId = req.body.experienceId;
  const gradeId = req.body.gradeId;
  const sectionId = req.body.sectionId;
  const livec = await liveControl.findOne({ schoolId });
  if (!livec) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No live classes found.");
  }
  livec.isStop = stop;
  livec.isStart = start;
  livec.experienceId = experienceId;
  livec.gradeId = gradeId;
  livec.sectionId = sectionId;
  if (livec.isStop === true) {
    await Session.updateMany({ schoolId }, { $set: { isDeployed: false } });
  }
  await livec.save();

  return livec;
};

module.exports = {
  provokeActiveAndSync,
  revokeActiveAndSync,
  queryActiveAndSyncTables,
  updateActiveAndSyncTableById,
  // liveStart,
  liveStop,
  updateStartStop,
};
