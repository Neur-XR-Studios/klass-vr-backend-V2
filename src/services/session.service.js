/* eslint-disable no-unreachable */
const httpStatus = require("http-status");
const { Session, Model3D, Video, Image360, Simulation } = require("../models");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types;

/**
 * Create a session
 * @param {Object} sessionBody
 * @param {ObjectId} teacherId
 * @returns {Promise<Session>}
 */
const createSession = async (sessionBody, teacherId, schoolId) => {
  const modifiedSessionBody = { ...sessionBody, teacherId, schoolId };
  return Session.create(modifiedSessionBody);
};

/**
 * Query for sessions with populated teacher information
 * @returns {Promise<QueryResult>}
 */
const querySessions = async () => {
  const result = await Session.aggregate([
    {
      $lookup: {
        from: "contents",
        localField: "_id",
        foreignField: "sessionId",
        as: "content",
      },
    },
    {
      $lookup: {
        from: "assessments",
        localField: "_id",
        foreignField: "sessionId",
        as: "assessment",
      },
    },
  ]);
  return result;
};

/**
 * Get session by id with populated teacher information
 * @param {ObjectId} id
 * @returns {Promise<Session>}
 */
const getSessionById = async (id) => {
  const result = await Session.aggregate([
    {
      $match: {
        _id: new ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "contents",
        localField: "_id",
        foreignField: "sessionId",
        as: "content",
      },
    },
    {
      $lookup: {
        from: "assessments",
        localField: "_id",
        foreignField: "sessionId",
        as: "assessment",
      },
    },
  ]);

  // Check if there's at least one session found
  if (result.length > 0 && result[0].content.length > 0) {
    // Handle video details (assuming there's only one video per content)
    const imageDetails = result[0].content[0].imageDetails;
    const simulationDetails = result[0].content[0].simulationDetails;
    const videoId =
      result[0].content[0].videoDetails.length > 0
        ? result[0].content[0].videoDetails[0].VideoId
        : null;
    const imageId =
      imageDetails && imageDetails.length > 0 ? imageDetails[0].ImageId : null;
    const simulationId =
      simulationDetails && simulationDetails.length > 0
        ? simulationDetails[0].simulationId
        : null;
    console.log("simulationDetails :", simulationDetails);
    console.log("simulationId :", simulationId);
    if (videoId) {
      const videoDetail = await Video.findOne({ _id: videoId });
      // Assuming videoDetails is an array and adding details to the first element
      if (videoDetail) {
        result[0].content[0].videoDetails[0].videoDetail = videoDetail;
      }
    }
    if (imageId) {
      const imageDetail = await Image360.findOne({ _id: imageId });
      // Assuming imageDetails is an array and adding details to the first element
      if (imageDetail) {
        result[0].content[0].imageDetails[0].imageDetail = imageDetail;
      }
    }

    if (simulationId) {
      const simulationDetail = await Simulation.findOne({ _id: simulationId });
      // Assuming imageDetails is an array and adding details to the first element
      if (simulationDetail) {
        result[0].content[0].simulationDetails[0].simulationDetail =
          simulationDetail;
      }
    }

    // Handle model details (there can be multiple models per content)
    for (const modelDetail of result[0].content[0].modelDetails) {
      const modelId = modelDetail.modelId;
      if (modelId) {
        const modelData = await Model3D.findOne({ _id: modelId });
        // Directly add the fetched modelData to the modelDetail
        modelDetail.modelData = modelData;
      }
    }
  }

  return result;
};

/**
 * Update session by id
 * @param {ObjectId} sessionId
 * @param {Object} updateBody
 * @returns {Promise<Session>}
 */
const updateSessionById = async (sessionId, updateBody) => {
  const session = await Session.findById(sessionId);

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, "Session not found");
  }

  Object.assign(session, updateBody);

  await session.save();

  return session;
};

/**
 * Delete session by id
 * @param {ObjectId} sessionId
 * @returns {Promise<void>}
 */
const deleteSessionById = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, "Session not found");
  }
  await Session.deleteOne({ _id: sessionId });
};

/**
 * Deploy a session by setting isDeployed to true and updating others to false
 * @param {string} sessionId
 * @returns {Promise<Session>}
 */
const deploySession = async (sessionId, schoolId) => {
  try {
    const objectIdSessionId = new mongoose.Types.ObjectId(sessionId);

    const updatedSession = await Session.findOneAndUpdate(
      { _id: objectIdSessionId },
      { $set: { isDeployed: true } },
      { new: true, runValidators: true }
    );

    if (!updatedSession) {
      throw new ApiError(httpStatus.NOT_FOUND, "Session not found");
    }

    await Session.updateMany(
      { _id: { $ne: objectIdSessionId } },
      { $set: { isDeployed: false } }
    );

    return updatedSession;
  } catch (error) {
    console.error("Error in deploySession:", error);
    throw error;
  }
};

/**
 * Filter sessions based on specified criteria
 * @param {Object} filters - Filtering criteria
 * @returns {Promise<Array<Session>>}
 */
const filterOption = async (filters, schoolId) => {
  try {
    const matchCriteria = { schoolId };

    if (filters.grade !== undefined && filters.grade.trim() !== "") {
      matchCriteria.grade = new RegExp(filters.grade, "i");
    }

    if (filters.subject !== undefined && filters.subject.trim() !== "") {
      matchCriteria.subject = new RegExp(filters.subject, "i");
    }

    if (Object.keys(matchCriteria).length === 0) {
      return Session.find();
    }

    const result = await Session.find(matchCriteria);
    return result;
  } catch (error) {
    console.error("Error in filterOption:", error);
    throw error;
  }
};

const queryUserSessions = async (filters, userId) => {
  const teacherId = userId;

  try {
    const matchCriteria = { teacherId };

    if (filters.grade !== undefined && filters.grade.trim() !== "") {
      matchCriteria.grade = { $regex: filters.grade, $options: "i" };
    }

    if (filters.subject !== undefined && filters.subject.trim() !== "") {
      matchCriteria.subject = { $regex: filters.subject, $options: "i" };
    }

    const result = await Session.find(matchCriteria);
    return result;
  } catch (error) {
    console.error("Error in queryUserSessions:", error);
    throw error;
  }
};

const getSessionsWithDrafts = async (userId) => {
  try {
    // Use the aggregation pipeline to efficiently find sessions that are drafts or have draft contents/assessments,
    // and immediately populate the related video and model details.
    const sessions = await Session.aggregate([
      {
        $match: {
          teacherId: new ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "contents",
          localField: "_id",
          foreignField: "sessionId",
          as: "contents",
        },
      },
      {
        $lookup: {
          from: "assessments",
          localField: "_id",
          foreignField: "sessionId",
          as: "assessments",
        },
      },
      {
        $addFields: {
          isDraftOrHasDraft: {
            $or: [
              "$isDraft",
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$contents",
                        as: "item",
                        cond: "$$item.isDraft",
                      },
                    },
                  },
                  0,
                ],
              },
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$assessments",
                        as: "item",
                        cond: "$$item.isDraft",
                      },
                    },
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          isDraftOrHasDraft: true,
        },
      },
    ]);

    // Process sessions to enrich them with videoDetails and modelData if they exist.
    // Note: Optimizations and corrections have been applied to ensure property names match and unnecessary iterations are removed.
    for (const session of sessions) {
      for (const content of session.contents) {
        // Handle video details
        if (content.videoDetails && content.videoDetails.length > 0) {
          const videoId = content.videoDetails[0].VideoId;
          if (videoId) {
            const videoDetail = await Video.findOne({ _id: videoId });
            // Add the video details directly
            if (videoDetail) {
              content.videoDetails[0].videoDetail = videoDetail;
            }
          }
        }

        // Handle model details
        for (const modelDetail of content.modelDetails || []) {
          const modelId = modelDetail.modelId;
          if (modelId) {
            const modelData = await Model3D.findOne({ _id: modelId });
            // Directly add the fetched modelData to the modelDetail
            if (modelData) {
              modelDetail.modelData = modelData;
            }
          }
        }
      }
    }

    return sessions;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve sessions with drafts");
  }
};

const getConflictingSession = async (schoolId, sessionTimeAndDate) => {
  try {
    const currentTime = new Date();
    const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000);

    const conflictingSession = await Session.findOne({
      schoolId,
      sessionTimeAndDate: {
        $gte: currentTime,
        $lt: oneHourLater,
      },
    });

    return conflictingSession;
  } catch (error) {
    throw new Error("Error occurred while fetching conflicting session");
  }
};

module.exports = {
  createSession,
  querySessions,
  getSessionById,
  updateSessionById,
  deleteSessionById,
  deploySession,
  filterOption,
  queryUserSessions,
  getSessionsWithDrafts,
  getConflictingSession,
};
