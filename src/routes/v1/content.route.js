const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const { contentValidation } = require("../../validations");
const { contentController } = require("../../controllers");

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Endpoints for managing content
 */

/**
 * @swagger
 * /content:
 *   get:
 *     summary: Retrieve all content
 *     description: Retrieve a list of all content entries
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modelName
 *         schema:
 *           type: string
 *         description: 3D model name filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: 3D model tags filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by query in the form of field:desc/asc (e.g., modelName:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of models
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: A list of content entries
 *         content:
 *           application/json:
 *             example:
 *               - _id: "612c8461e0c03d687031d64c"
 *                 sessionId: "612c8405e0c03d687031d648"
 *                 script: "Sample script"
 *                 modelDetails: []
 *                 videoDetails: []
 *                 imageDetails: []
 *                 simulationDetails: []
 *                 teacherCharacterGender: "male"
 *               - _id: "612c846de0c03d687031d64d"
 *                 sessionId: "612c8405e0c03d687031d648"
 *                 script: "Another script"
 *                 modelDetails: []
 *                 videoDetails: []
 *                 imageDetails: []
 *                 simulationDetails: []
 *                 teacherCharacterGender: "female"
 *                 youTubeUrl: https://youtu.be/x8-JCOfJ4Oc?si=4y5-AFqKYm1sz994
 *                 youTubeVideoAudio: true
 *                 youTubeVideoScript: description about the video
 *                 youTubeStartTimer: 05:20
 *                 youTubeEndTimer: 06:45
 *                 classEnvironment: Environment 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

router.get(
  "/",
  auth("commonPermission"),
  validate(contentValidation.getContents),
  contentController.getContents
);

/**
 * @swagger
 * /content/{contentId}:
 *   get:
 *     summary: Retrieve content by ID
 *     description: Retrieve a specific content entry by its ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         description: ID of the content entry to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: The requested content entry
 *         content:
 *           application/json:
 *             example:
 *               _id: "612c8461e0c03d687031d64c"
 *               sessionId: "612c8405e0c03d687031d648"
 *               script: "Sample script"
 *               modelDetails: []
 *               videoDetails: []
 *               imageDetails: []
 *               simulationDetails: []
 *               teacherCharacterGender: "male"
 *               youTubeUrl: https://youtu.be/x8-JCOfJ4Oc?si=4y5-AFqKYm1sz994
 *               youTubeVideoAudio: true
 *               youTubeVideoScript: description about the video
 *               youTubeStartTimer: 05:20
 *               youTubeEndTimer: 06:45
 *               classEnvironment: Environment 1
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:contentId",
  auth("commonPermission"),
  validate(contentValidation.getContent),
  contentController.getContentById
);

/**
 * @swagger
 * /content:
 *   post:
 *     summary: Create new content
 *     description: Create a new content entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             sessionId: "612c8405e0c03d687031d648"
 *             script: "Sample script"
 *             language: "spanish"
 *             modelDetails: [
 *               {
 *                 script: "Model script 1",
 *                 modelId: "612c8405e0c03d687031d648",
 *                 modelCoordinates: "Json"
 *               },
 *               {
 *                 script: "Model script 2",
 *                 modelId: "612c8405e0c03d687031d648",
 *                 modelCoordinates: "Json"
 *               }
 *             ]
 *             videoDetails: [
 *               {
 *                 script: "Video script 1",
 *                 VideoId: "612c8405e0c03d687031d648"
 *               },
 *               {
 *                 script: "Video script 2",
 *                 VideoId: "612c8405e0c03d687031d648"
 *               }
 *             ]
 *             imageDetails: [
 *               {
 *                 script: "Image script 1",
 *                 ImageId: "612c8405e0c03d687031d321"
 *               },
 *               {
 *                 script: "Image script 2",
 *                 ImageId: "612c8405e0c03d687031d123"
 *               }
 *             ]
 *             simulationDetails: [
 *               {
 *                 script: "Simulation script 1",
 *                 simulationId: "612c8405e0c03d687031d321"
 *               }
 *             ]
 *             teacherCharacterGender: "male"
 *             youTubeUrl: https://youtu.be/x8-JCOfJ4Oc?si=4y5-AFqKYm1sz994
 *             youTubeVideoAudio: true
 *             youTubeVideoScript: description about the video
 *             youTubeStartTimer: 05:20
 *             youTubeEndTimer: 06:45
 *             classEnvironment: Environment 1
 *             isDraft: true
 *     responses:
 *       "201":
 *         description: The newly created content entry
 *         content:
 *           application/json:
 *             example:
 *               _id: "612c8461e0c03d687031d64c"
 *               sessionId: "612c8405e0c03d687031d648"
 *               script: "Sample script"
 *               language: "spanish"
 *               modelDetails: [
 *                 {
 *                    script: "Model script 1",
 *                    modelId: "612c8405e0c03d687031d648",
 *                    modelCoordinates: "Json",
 *                    displayTime: "20.0"
 *                 },
 *                 {
 *                    script: "Model script 2",
 *                    modelId: "612c8405e0c03d687031d648",
 *                    modelCoordinates: "Json",
 *                    displayTime: "20.0"
 *                 }
 *               ]
 *               videoDetails: [
 *                 {
 *                    script: "Video script 1",
 *                    VideoId: "612c8405e0c03d687031d648"
 *                 },
 *                 {
 *                    script: "Video script 2",
 *                    VideoId: "612c8405e0c03d687031d648"
 *                 }
 *               ]
 *               imageDetails: [
 *                 {
 *                   script: "Image script 1",
 *                   ImageId: "612c8405e0c03d687031d321"
 *                 },
 *                 {
 *                   script: "Image script 2",
 *                   ImageId: "612c8405e0c03d687031d123"
 *                 }
 *               ]
 *               simulationDetails: [
 *                 {
 *                   script: "Simulation script 1",
 *                   simulationId: "612c8405e0c03d687031d321"
 *                 }
 *               ]
 *               teacherCharacterGender: "male"
 *               youTubeUrl: https://youtu.be/x8-JCOfJ4Oc?si=4y5-AFqKYm1sz994
 *               youTubeVideoAudio: true
 *               youTubeVideoScript: description about the video
 *               youTubeStartTimer: 05:20
 *               youTubeEndTimer: 06:45
 *               classEnvironment: Environment 1
 *               isDraft: true
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */

router.post(
  "/",
  auth("commonPermission"),
  validate(contentValidation.createContent),
  contentController.createContent
);

/**
 * @swagger
 * /content/{contentId}:
 *   patch:
 *     summary: Update content by ID
 *     description: Update a specific content entry by its ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         description: ID of the content entry to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             script: "Updated script"
 *             teacherCharacterGender: "female"
 *     responses:
 *       "200":
 *         description: The updated content entry
 *         content:
 *           application/json:
 *             example:
 *               _id: "612c8461e0c03d687031d64c"
 *               sessionId: "612c8405e0c03d687031d648"
 *               script: "Updated script"
 *               modelDetails: []
 *               videoDetails: []
 *               imageDetails: []
 *               simulationDetails: []
 *               teacherCharacterGender: "female"
 *               youTubeUrl: https://youtu.be/x8-JCOfJ4Oc?si=4y5-AFqKYm1sz994
 *               youTubeVideoAudio: true
 *               youTubeVideoScript: description about the video
 *               youTubeStartTimer: 05:20
 *               youTubeEndTimer: 06:45
 *               classEnvironment: Environment 1
 *               isDraft: true
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  "/:contentId",
  auth("commonPermission"),
  validate(contentValidation.updateContent),
  contentController.updateContentById
);

/**
 * @swagger
 * /content/{contentId}:
 *   delete:
 *     summary: Delete content by ID
 *     description: Delete a specific content entry by its ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         description: ID of the content entry to delete
 *         schema:
 *           type: string
 *     responses:
 *       "204":
 *         description: Content successfully deleted
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:contentId",
  auth("commonPermission"),
  validate(contentValidation.deleteContent),
  contentController.deleteContentById
);

/**
 * @swagger
 * /content/{contentId}/modelDetails:
 *   patch:
 *     summary: Update model details for a content
 *     description: Update the model details for a specific content entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         description: ID of the content entry to update model details
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: {
 *             "modelDetails": [
 *               {
 *                 "_id": "66018ea074d02d26010dfcdb",
 *                 "modelCoordinates": "Json"
 *               }
 *             ]
 *           }
 *     responses:
 *       "200":
 *         description: The content entry with updated model details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  "/:contentId/modelDetails",
  auth("commonPermission"),
  validate(contentValidation.updateModelDetails),
  contentController.updateModelDetailsById
);

module.exports = router;
