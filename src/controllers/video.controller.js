const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { videoService } = require("../services");

const createVideo = catchAsync(async (req, res) => {
  const video = await videoService.createVideo(req);
  res.status(httpStatus.CREATED).send(video);
});

const getVideos = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["title", "role", "tags"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await videoService.queryVideos(filter, options);
  res.send(result);
});

const getVideo = catchAsync(async (req, res) => {
  const video = await videoService.getVideoById(req.params.videoId);
  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
  }
  res.send(video);
});

const updateVideo = catchAsync(async (req, res) => {
  const video = await videoService.updateVideoById(
    req.params.videoId,
    req.body
  );
  res.send(video);
});

const deleteVideo = catchAsync(async (req, res) => {
  await videoService.deleteVideoById(req.params.videoId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAllTags = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const tags = await videoService.getAllTags(schoolId);
  res.send(tags);
});

const getTags = catchAsync(async (req, res) => {
  const schoolId = req.user.schoolId;
  const tags = await videoService.getTags(schoolId);
  res.send(tags);
});

module.exports = {
  createVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  getAllTags,
  getTags,
};
