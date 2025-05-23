require("dotenv").config();
const path = require("path");
const httpStatus = require("http-status");
const { Image360, User } = require("../models");
const ApiError = require("../utils/ApiError");
const { uploadToS3, deleteFileFromS3 } = require("../utils/multer");

/**
 * Create an image
 * @param {Object} imageBody
 * @returns {Promise<Image360>}
 */
const createImage = async (imageBody) => {
  try {
    const { title, description, tags } = imageBody.body;
    const imageFile =
      imageBody.files &&
      imageBody.files.find((file) => file.fieldname === "imageFile");

    // Handle file uploads and get the file URL
    const updatedFiles = await uploadToS3(
      {
        ...imageFile,
        format: path.extname(imageFile.originalname),
      },
      "360images"
    );

    const image = new Image360({
      imageURL: updatedFiles,
      fileSize: imageFile.size,
      format: imageFile.format,
      createdBy: imageBody.user._id,
      title,
      description,
      tags,
      userRole: imageBody.user.role,
    });

    return image.save();
  } catch (error) {
    console.error("Error creating image:", error);
    throw new Error("Image creation failed");
  }
};

/**
 * Update an existing image record's metadata.
 *
 * @param {String} imageId - The ID of the image to update.
 * @param {Object} updateData - The new image data, including title, description, and tags array.
 * @returns {Promise<Object>} - The updated image document.
 */
const updateImageById = async (imageId, updateData) => {
  const image = await Image360.findById(imageId);
  if (!image) {
    throw new Error("Image not found");
  }

  // Update metadata fields like title, description, and tags
  if (updateData.title) image.title = updateData.title;
  if (updateData.description) image.description = updateData.description;
  if (updateData.tags && Array.isArray(updateData.tags))
    image.tags = updateData.tags;

  await image.save();

  return image;
};

/**
 * Query for images
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryImages = async (filter, options) => {
  filter.userRole = "repoManager";
  const images = await Image360.paginate(filter, options);
  return images;
};

/**
 * Get image by id
 * @param {ObjectId} imageId
 * @returns {Promise<Image360>}
 */
const getImageById = async (imageId) => {
  return Image360.findById(imageId);
};

/**
 * Delete image by id
 * @param {ObjectId} imageId
 * @returns {Promise<Image360>}
 */
const deleteImageById = async (imageId) => {
  const imageData = await getImageById(imageId);
  await deleteFileFromS3("360images", imageData.imageURL);
  const image = await Image360.findByIdAndDelete(imageId);
  if (!image) {
    throw new ApiError(httpStatus.NOT_FOUND, "Image not found");
  }
  return image;
};

/**
 * Get all unique tags
 * @returns {Promise<Array>}
 */
const getAllTags = async (schoolId) => {
  const users = await User.find({ role: "repoManager" }).select("_id");
  const userIds = users.map((user) => user._id);

  const images = await Image360.find({ createdBy: { $in: userIds } }).select(
    "tags -_id"
  );
  const tags = images.flatMap((image) => image.tags);
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
    userIds = users.map((user) => user._id);
  } else {
    const users = await User.find({ userRole: "repoManager" }).select("_id");
    userIds = users.map((user) => user._id);
  }

  const images = await Image360.find({ createdBy: { $in: userIds } }).select(
    "tags -_id"
  );
  const tags = images.flatMap((image) => image.tags);

  return Array.from(new Set(tags));
};

module.exports = {
  createImage,
  queryImages,
  getImageById,
  updateImageById,
  deleteImageById,
  getAllTags,
  getTags,
};
