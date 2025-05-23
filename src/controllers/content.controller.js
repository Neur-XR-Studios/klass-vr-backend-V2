const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { contentService } = require('../services');

const createContent = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const content = await contentService.createContent(req.body, userId);
  res.status(httpStatus.CREATED).send(content);
});

const getContents = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const contents = await contentService.queryContent(filter, options);
  res.send(contents);
});

const getContentById = catchAsync(async (req, res) => {
  const content = await contentService.getContentById(req.params.contentId);
  if (!content) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Content not found');
  }
  res.send(content);
});

const updateContentById = catchAsync(async (req, res) => {
  const content = await contentService.updateContentById(req.params.contentId, req.body);
  res.send(content);
});

const deleteContentById = catchAsync(async (req, res) => {
  await contentService.deleteById(req.params.contentId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateModelDetailsById = catchAsync(async (req, res) => {
  const { contentId } = req.params;
  const { modelDetails } = req.body;
  const updatedContent = await contentService.updateModelDetailsById(contentId, modelDetails);
  res.send(updatedContent);
});

module.exports = {
  createContent,
  getContents,
  getContentById,
  updateContentById,
  deleteContentById,
  updateModelDetailsById,
};
