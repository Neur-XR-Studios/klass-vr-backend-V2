const express = require('express');
const youtubeProxyController = require('../../controllers/youtubeProxy.controller');
const auth = require('../../middlewares/auth');
const deviceAuth = require('../../middlewares/device');

const router = express.Router();

// Note: deviceAuth removed for /stream endpoint because HTML <video> tags 
// cannot send custom headers. This endpoint is rate-limited in the controller.
router
  .route('/stream')
  .get(youtubeProxyController.proxyYouTubeStream);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: YouTube Proxy
 *   description: Proxy YouTube video streams with proper headers
 */

/**
 * @swagger
 * /youtube-proxy/stream:
 *   get:
 *     summary: Proxy YouTube video stream
 *     description: Streams YouTube video with proper headers to avoid 403 errors
 *     tags: [YouTube Proxy]
 *     security:
 *       - DeviceIDAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: The YouTube video URL to proxy
 *     responses:
 *       '200':
 *         description: Video stream
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: Missing URL parameter
 *       '500':
 *         description: Failed to proxy stream
 */
