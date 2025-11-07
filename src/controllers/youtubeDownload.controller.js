const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const jobQueueService = require('../services/jobQueue.service');
const { Content } = require('../models');

/**
 * Get YouTube download queue status
 */
const getQueueStatusHandler = catchAsync(async (req, res) => {
  const status = jobQueueService.getQueueStatus();
  res.send(status);
});

/**
 * Get YouTube download status for specific content
 */
const getDownloadStatus = catchAsync(async (req, res) => {
  const { contentId } = req.params;
  
  const content = await Content.findById(contentId).select(
    'youTubeUrl youTubeDownloadStatus youTubeDownloadedUrl youTubeDownloadProgress youTubeDownloadError'
  );
  
  if (!content) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'Content not found' });
  }
  
  res.send({
    contentId,
    youTubeUrl: content.youTubeUrl,
    downloadStatus: content.youTubeDownloadStatus,
    downloadedUrl: content.youTubeDownloadedUrl,
    progress: content.youTubeDownloadProgress,
    error: content.youTubeDownloadError,
  });
});

module.exports = {
  getQueueStatus: getQueueStatusHandler,
  getDownloadStatus,
};
