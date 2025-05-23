const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const modelValidation = require("../../validations/3dmodel.validation");
const modelController = require("../../controllers/3dmodel.controller");
const { uploadFiles } = require("../../utils/multer");

const router = express.Router();

router.route("/tags").get(auth("commonPermission"), modelController.getAllTags);
router
  .route("/tags-belongs-to-schools")
  .get(auth("commonPermission"), modelController.getTags);

router
  .route("/")
  .post(
    auth("commonPermission"),
    uploadFiles,
    validate(modelValidation.createModel),
    modelController.createModel
  )
  .get(
    auth("commonPermission"),
    validate(modelValidation.queryModels),
    modelController.getModels
  );

router
  .route("/:modelId")
  .get(
    auth("commonPermission"),
    validate(modelValidation.getModelById),
    modelController.getModel
  )
  .patch(
    auth("commonPermission"),
    validate(modelValidation.updateModelById),
    modelController.updateModel
  )
  .delete(
    auth("commonPermission"),
    validate(modelValidation.deleteModelById),
    modelController.deleteModel
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Models
 *   description: 3D model management and retrieval
 */

/**
 * @swagger
 * /models:
 *   post:
 *     summary: Create a 3D model
 *     description: Only authorized users can create 3D models.
 *     tags: [Models]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - modelName
 *               - modelFile
 *               - thumbnailFile
 *             properties:
 *               modelName:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               modelFile:
 *                 type: file
 *               thumbnailFile:
 *                 type: file
 *             example:
 *               modelName: Sample 3D Model
 *               description: A description of the 3D model
 *               tags: ["tag1", "tag2"]
 *               modelFile: File
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Model'
 *       "400":
 *         description: Bad Request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all 3D models
 *     description: Retrieves a list of 3D models based on filters.
 *     tags: [Models]
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
 *         description: sort by query in the form of field:desc/asc (ex. modelName:asc)
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
 *                     $ref: '#/components/schemas/Model'
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
 * /models/{id}:
 *   get:
 *     summary: Get a 3D model
 *     description: Fetches a single 3D model by ID.
 *     tags: [Models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Model'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not Found
 *
 *   patch:
 *     summary: Update a 3D model
 *     description: Only authorized users can update 3D model details.
 *     tags: [Models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelName:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               modelName: Updated Model Name
 *               description: Updated description of the 3D model
 *               tags: ["updatedTag1", "updatedTag2"]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Model'
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
 *     summary: Delete a 3D model
 *     description: Only authorized users can delete 3D models.
 *     tags: [Models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model id
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
 * /models/tags:
 *   get:
 *     summary: Get all unique tags
 *     description: Retrieve a list of all unique tags associated with models.
 *     tags: [Models]
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
 * /models/tags-belongs-to-schools:
 *   get:
 *     summary: Get tags based on school ID
 *     description: Retrieve a list of unique tags associated with models. If the user has a school ID, only tags for that school are retrieved. If not, tags from repoManager users are retrieved.
 *     tags: [Models]
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
