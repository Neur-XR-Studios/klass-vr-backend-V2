const express = require('express');
const auth = require('../../middlewares/auth');
const { youtubeDownloadController } = require('../../controllers');

const router = express.Router();

/**
 * @swagger
 * /youtube-download/queue:
 *   get:
 *     summary: Get YouTube download queue status
 *     description: Returns current status of the download queue
 *     tags: [YouTube Download]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Queue status
 *         content:
 *           application/json:
 *             example:
 *               queued: 2
 *               processing: 1
 *               jobs: []
 *               processingJobs: ["507f1f77bcf86cd799439011"]
 */
router.get('/queue', auth('commonPermission'), youtubeDownloadController.getQueueStatus);

/**
 * @swagger
 * /youtube-download/status/{contentId}:
 *   get:
 *     summary: Get YouTube download status for content
 *     description: Returns download status for a specific content
 *     tags: [YouTube Download]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Download status
 *         content:
 *           application/json:
 *             example:
 *               contentId: "507f1f77bcf86cd799439011"
 *               youTubeUrl: "https://youtu.be/nV_hd6bLXmw"
 *               downloadStatus: "completed"
 *               downloadedUrl: "https://klass-vr-file.s3.us-east-1.amazonaws.com/youtube-videos/..."
 *               progress: 100
 *               error: null
 */
router.get('/status/:contentId', auth('commonPermission'), youtubeDownloadController.getDownloadStatus);

module.exports = router;
