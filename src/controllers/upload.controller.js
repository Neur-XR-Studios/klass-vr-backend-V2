const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { initiateMultipart, getPartPresignedUrls, completeMultipart, abortMultipart } = require('../services/upload.service');

const initiate = catchAsync(async (req, res) => {
  const { fileName, contentType, folder } = req.body;
  const result = await initiateMultipart({ fileName, contentType, folder });
  res.status(httpStatus.OK).send(result);
});

const presign = catchAsync(async (req, res) => {
  const { uploadId, key, partNumbers } = req.body;
  const urls = await getPartPresignedUrls({ uploadId, key, partNumbers });
  res.status(httpStatus.OK).send({ urls });
});

const complete = catchAsync(async (req, res) => {
  const { uploadId, key, parts } = req.body;
  const result = await completeMultipart({ uploadId, key, parts });
  res.status(httpStatus.OK).send(result);
});

const abort = catchAsync(async (req, res) => {
  const { uploadId, key } = req.body;
  const result = await abortMultipart({ uploadId, key });
  res.status(httpStatus.OK).send(result);
});

module.exports = { initiate, presign, complete, abort };
