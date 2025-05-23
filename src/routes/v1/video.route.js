const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const videoValidation = require("../../validations/video.validation");
const videoController = require("../../controllers/video.controller");
const { uploadFiles } = require("../../utils/multer");

const router = express.Router();

router.route("/tags").get(auth("manageVideos"), videoController.getAllTags);
router
  .route("/tags-belongs-to-schools")
  .get(auth("manageVideos"), videoController.getTags);

router
  .route("/")
  .post(
    auth("manageVideos"),
    uploadFiles,
    validate(videoValidation.createVideo),
    videoController.createVideo
  )
  .get(
    auth("manageVideos"),
    validate(videoValidation.queryVideos),
    videoController.getVideos
  );

router
  .route("/:videoId")
  .get(
    auth("manageVideos"),
    validate(videoValidation.getVideoById),
    videoController.getVideo
  )
  .patch(
    auth("manageVideos"),
    validate(videoValidation.updateVideoById),
    videoController.updateVideo
  )
  .delete(
    auth("manageVideos"),
    validate(videoValidation.deleteVideoById),
    videoController.deleteVideo
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management and retrieval
 */

/**
 * @swagger
 * /video:
 *   post:
 *     summary: Create a video
 *     description: Only authorized users can create videos.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tags
 *               - videoFile
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               typeOfVideo:
 *                 type: string
 *                 enum:
 *                   - stereoscopic-side-to-side
 *                   - stereoscopic-top-to-bottom
 *                   - monoscopic
 *               videoFile:
 *                 type: file
 *             example:
 *               title: Sample Video
 *               description: A description of the video
 *               tags: ["tag1", "tag2"]
 *               videoFile: File
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Video'
 *       "400":
 *         description: Bad Request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all videos
 *     description: Retrieves a list of videos based on filters.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Video title filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Video tags filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. title:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of videos
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *
 * /video/{id}:
 *   get:
 *     summary: Get a video
 *     description: Fetches a single video by ID.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Video'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not Found
 *
 *   patch:
 *     summary: Update a video
 *     description: Only authorized users can update video details.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               title: Updated Video Title
 *               description: Updated description of the video
 *               tags: ["updatedTag1", "updatedTag2"]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Video'
 *       "400":
 *         description: Bad Request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not Found
 *
 *   delete:
 *     summary: Delete a video
 *     description: Only authorized users can delete videos.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video id
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not Found
 */

/**
 * @swagger
 * /video/tags:
 *   get:
 *     summary: Get all unique tags
 *     description: Retrieve a list of all unique tags associated with videos.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /video/tags-belongs-to-schools:
 *   get:
 *     summary: Get tags based on school ID
 *     description: Retrieve a list of unique tags associated with videos. If the user has a school ID, only tags for that school are retrieved. If not, tags from repoManager users are retrieved.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
