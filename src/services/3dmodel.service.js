require("dotenv");
const path = require("path");
const { Model3D, User } = require("../models");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { uploadToS3, deleteFileFromS3 } = require("../utils/multer");
// const { GLTFLoader } = require("three-stdlib");
// const { JSDOM } = require("jsdom");

const calculatePolygonCount = (model) => {
  let count = 0;
  model.traverse((object) => {
    if (object.isMesh) {
      const geometry = object.geometry;
      count += geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;
    }
  });
  return count;
};

// const loadPolygonCount = async (modelFileBuffer) => {
//   try {
//     // Setting up JSDOM to provide a global context
//     const { window } = new JSDOM();
//     global.window = window;
//     global.document = window.document;
//     global.self = window; // Provide a 'self' reference as expected by GLTFLoader

//     const loader = new GLTFLoader();
//     const data = modelFileBuffer;
//     const gltf = await new Promise((resolve, reject) => {
//       loader.parse(data, "", resolve, reject);
//     });

//     const polygonCount = calculatePolygonCount(gltf.scene);
//     return polygonCount;
//   } catch (error) {
//     console.error("Error loading model:", error);
//     throw error;
//   }
// };

/**
 * Create a 3D model record with metadata.
 * @param {Object} modelBody - The request body with 3D model data.
 * @returns {Promise<Model3D>}
 */
const createModel = async (modelBody) => {
  const startTime = Date.now();
  try {
    const { modelName, description, tags } = modelBody.body;
    const modelFile =
      modelBody.files &&
      modelBody.files.find((file) => file.fieldname === "modelFile");
    const modelThumbnailFile =
      modelBody.files &&
      modelBody.files.find((file) => file.fieldname === "thumbnailFile");
    // const polyCount = await loadPolygonCount(modelFile.buffer);
    // console.log('polyCount :', polyCount);
    // Upload the model file to S3
    const modelFileUrl = await uploadToS3(
      {
        ...modelFile,
        format: path.extname(modelFile.originalname),
      },
      "models"
    );

    const modelThumbnailFileUrl = await uploadToS3(
      {
        ...modelThumbnailFile,
        format: path.extname(modelThumbnailFile.originalname),
      },
      "thumbnails"
    );
    console.log("Execution time for uploading to S3:", Date.now() - startTime);
    const metadata = {};

    const model = new Model3D({
      modelName,
      modelUrl: modelFileUrl,
      thumbnailUrl: modelThumbnailFileUrl,
      description,
      tags,
      metadata,
      createdBy: modelBody.user._id,
      userRole: modelBody.user.role,
    });

    console.log("Total execution time:", Date.now() - startTime);

    return model.save();
  } catch (error) {
    console.error("Error creating model:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Model creation failed"
    );
  }
};

/**
 * Update an existing 3D model record's metadata.
 *
 * @param {String} modelId - The ID of the model to update.
 * @param {Object} updateData - The new model data.
 * @returns {Promise<Object>} - The updated model document.
 */
const updateModelById = async (modelId, updateData) => {
  const model = await Model3D.findById(modelId);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, "Model not found");
  }

  Object.keys(updateData).forEach((field) => {
    model[field] = updateData[field];
  });

  await model.save();
  return model;
};

const queryModels = async (filter, options) => {
  filter.userRole = "repoManager";
  const models = await Model3D.paginate(filter, options);
  return models;
};

const getModelById = async (modelId) => {
  return Model3D.findById(modelId);
};

const deleteModelById = async (modelId) => {
  const modelData = await getModelById(modelId);
  await deleteFileFromS3("models", modelData.modelUrl);
  await deleteFileFromS3("thumbnails", modelData.thumbnailUrl);
  const model = await Model3D.findByIdAndDelete(modelId);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, "Model not found");
  }
  return model;
};

/**
 * Get all unique tags
 * @returns {Promise<Array>}
 */
const getAllTags = async (schoolId) => {
  const users = await User.find({ role: "repoManager" }).select("_id");
  const userIds = users.map((user) => user._id);

  const models = await Model3D.find({ createdBy: { $in: userIds } }).select(
    "tags -_id"
  );
  const tags = models.flatMap((model) => model.tags);
  return Array.from(new Set(tags));
};

/**
 * Get tags based on school ID and user role
 * @param {ObjectId} schoolId
 * @returns {Promise<Array>}
 */
const getTags = async (schoolId) => {
  let userIds = [];

  if (schoolId) {
    const users = await User.find({ schoolId }).select("_id");
    const repoManagers = await User.find({ role: "repoManager" }).select("_id");

    userIds = [
      ...users.map((user) => user._id),
      ...repoManagers.map((manager) => manager._id),
    ];
  }

  // Find 3D models created by any of the found userIds and retrieve tags
  const models = await Model3D.find({ createdBy: { $in: userIds } }).select(
    "tags -_id"
  );
  const tags = models.flatMap((model) => model.tags);

  // Return unique tags
  return Array.from(new Set(tags));
};

module.exports = {
  createModel,
  queryModels,
  getModelById,
  updateModelById,
  deleteModelById,
  getAllTags,
  getTags,
};
