const httpStatus = require("http-status");
const { Content } = require("../models");
const { sessionService } = require(".");
const ApiError = require("../utils/ApiError");

/**
 * Create a new content entry
 * @param {Array<Object>} contentBodies
 * @param {ObjectId} sessionId
 * @returns {Promise<Array<Content>>}
 */
const createContent = async (body, userId) => {
  const {
    sessionId,
    modelDetails,
    videoDetails,
    imageDetails,
    simulationDetails,
    script,
    teacherCharacterGender,
    isDraft,
    language,
    youTubeUrl,
    youTubeVideoAudio,
    youTubeVideoScript,
    youTubeStartTimer,
    youTubeEndTimer,
    classEnvironment,
  } = body;

  const sessionExist = await sessionService.getSessionById(sessionId);
  if (!sessionExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Session not found");
  }
  try {
    const content = new Content({
      sessionId,
      script,
      modelDetails,
      videoDetails,
      imageDetails,
      simulationDetails,
      teacherCharacterGender,
      isDraft,
      language,
      createdBy: userId,
      youTubeUrl,
      youTubeVideoAudio,
      youTubeVideoScript,
      youTubeStartTimer,
      youTubeEndTimer,
      classEnvironment,
    });

    const savedContent = await content.save();

    return savedContent;
  } catch (error) {
    console.error(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to save content"
    );
  }
};

/**
 * Query for all content
 * @returns {Promise<Array<Content>>}
 */
const queryContent = async (filter, options) => {
  const { page = 1, limit = 10 } = options;
  const query = Content.find(filter)
    .populate("sessionId")
    .populate("createdBy", "username")
    .populate("schoolId")
    .populate("modelDetails.modelId")
    .populate("videoDetails.VideoId")
    .populate("imageDetails.ImageId")
    .populate("simulationDetails.simulationId");

  const paginateOptions = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      docs: "contents",
      totalDocs: "totalContents",
    },
  };

  const result = await Content.paginate(query, paginateOptions);
  return result;
};

/**
 * Get content by ID
 * @param {ObjectId} id
 * @returns {Promise<Content>}
 */
const getContentById = async (id) => {
  const content = await Content.findById(id).populate("sessionId").exec();
  if (!content) {
    throw new ApiError(httpStatus.NOT_FOUND, "Content not found");
  }
  return content;
};

/**
 * Update content by ID
 * @param {ObjectId} contentId
 * @param {Object} updateBody
 * @returns {Promise<Content>}
 */
const updateContentById = async (contentId, updateBody) => {
  try {
    const {
      sessionId,
      script,
      modelDetails,
      videoDetails,
      imageDetails,
      simulationDetails,
      teacherCharacterGender,
      isDraft,
      language,
      youTubeUrl,
      youTubeVideoAudio,
      youTubeVideoScript,
      youTubeStartTimer,
      youTubeEndTimer,
      classEnvironment,
    } = updateBody;
    const updateOperations = {};
    const options = { new: true };

    if (modelDetails) {
      updateOperations.modelDetails = modelDetails;
    }

    if (videoDetails) {
      updateOperations.videoDetails = videoDetails;
    }

    if (imageDetails) {
      updateOperations.imageDetails = imageDetails;
    }

    if (simulationDetails) {
      updateOperations.simulationDetails = simulationDetails;
    }

    if (typeof teacherCharacterGender !== "undefined") {
      updateOperations.teacherCharacterGender = teacherCharacterGender;
    }
    if (typeof isDraft !== "undefined") {
      updateOperations.isDraft = isDraft;
    }
    if (script) {
      updateOperations.script = script;
    }
    if (sessionId) {
      updateOperations.sessionId = sessionId;
    }
    if (language) {
      updateOperations.language = language;
    }
    if (classEnvironment) {
      updateOperations.classEnvironment = classEnvironment;
    }
    if (youTubeUrl) {
      updateOperations.youTubeUrl = youTubeUrl;
    } else if (youTubeUrl == "") {
      updateOperations.youTubeUrl = "";
    }

    if (youTubeVideoAudio) {
      updateOperations.youTubeVideoAudio = youTubeVideoAudio;
    } else if (youTubeVideoAudio == false) {
      updateOperations.youTubeVideoAudio = false;
    }

    if (youTubeVideoScript) {
      updateOperations.youTubeVideoScript = youTubeVideoScript;
    } else if (youTubeVideoScript == "") {
      updateOperations.youTubeVideoScript = "";
    }

    if (youTubeStartTimer) {
      updateOperations.youTubeStartTimer = youTubeStartTimer;
    } else if (youTubeStartTimer == "") {
      updateOperations.youTubeStartTimer = "";
    }

    if (youTubeEndTimer) {
      updateOperations.youTubeEndTimer = youTubeEndTimer;
    } else if (youTubeEndTimer == "") {
      updateOperations.youTubeEndTimer = "";
    }

    // Ensure there's something to update
    if (Object.keys(updateOperations).length > 0) {
      const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        updateOperations,
        options
      );

      if (!updatedContent) {
        throw new Error("Content not found");
      }

      return updatedContent;
    } else {
      throw new Error("No update operations provided");
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update content");
  }
};

/**
 * Delete content by ID
 * @param {ObjectId} contentId
 * @returns {Promise<Content>}
 */
const deleteContentById = async (contentId) => {
  const content = await getContentById(contentId);
  await content.remove();
  return content;
};

/**
 * Update modelDetails within a content entry
 * @param {ObjectId} contentId
 * @param {Array<Object>} modelDetailsUpdates - Array of modelDetails with their _id and updates
 * @returns {Promise<Content>}
 */
const updateModelDetailsById = async (contentId, modelDetailsUpdates) => {
  const content = await Content.findById(contentId);
  if (!content) {
    throw new ApiError(httpStatus.NOT_FOUND, "Content not found");
  }
  console.log("modelDetailsUpdates :", modelDetailsUpdates);
  modelDetailsUpdates.forEach((update) => {
    const detailIndex = content.modelDetails.findIndex(
      (detail) => detail._id.toString() === update._id
    );
    console.log("detailIndex :", detailIndex);
    if (detailIndex !== -1) {
      Object.assign(content.modelDetails[detailIndex], update);
    }
  });
  await content.save();
  return content;
};

module.exports = {
  createContent,
  queryContent,
  getContentById,
  updateContentById,
  deleteContentById,
  updateModelDetailsById,
};
