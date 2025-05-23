const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { Image360Service } = require("../services");

const createImage = catchAsync(async (req, res) => {
  const image = await Image360Service.createImage(req);
  res.status(httpStatus.CREATED).send(image);
});

const getImages = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["title", "createdBy", "tags"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await Image360Service.queryImages(filter, options);
  res.send(result);
});

const getImage = catchAsync(async (req, res) => {
  const image = await Image360Service.getImageById(req.params.imageId);
  if (!image) {
    throw new ApiError(httpStatus.NOT_FOUND, "Image not found");
  }
  res.send(image);
});

const updateImage = catchAsync(async (req, res) => {
  const image = await Image360Service.updateImageById(
    req.params.imageId,
    req.body
  );
  res.send(image);
});

const deleteImage = catchAsync(async (req, res) => {
  await Image360Service.deleteImageById(req.params.imageId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAllTags = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const tags = await Image360Service.getAllTags(schoolId);
  res.send(tags);
});

const getTags = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const tags = await Image360Service.getTags(schoolId);
  res.send(tags);
});

module.exports = {
  createImage,
  getImages,
  getImage,
  updateImage,
  deleteImage,
  getAllTags,
  getTags,
};
