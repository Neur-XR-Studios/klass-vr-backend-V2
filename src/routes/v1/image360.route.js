const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const imageValidation = require("../../validations/360image.validation");
const imageController = require("../../controllers/360image.controller");
const { uploadFiles } = require("../../utils/multer");

const router = express.Router();

router.route("/tags").get(auth("manageImages"), imageController.getAllTags);
router
  .route("/tags-belongs-to-schools")
  .get(auth("manageImages"), imageController.getTags);

router
  .route("/")
  .post(
    auth("manageImages"),
    uploadFiles,
    validate(imageValidation.createImage),
    imageController.createImage
  )
  .get(
    auth("manageImages"),
    validate(imageValidation.getImages),
    imageController.getImages
  );

router
  .route("/:imageId")
  .get(
    auth("manageImages"),
    validate(imageValidation.getImage),
    imageController.getImage
  )
  .patch(
    auth("manageImages"),
    validate(imageValidation.updateImage),
    imageController.updateImage
  )
  .delete(
    auth("manageImages"),
    validate(imageValidation.deleteImage),
    imageController.deleteImage
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image management and retrieval
 */

/**
 * @swagger
 * /images:
 *   post:
 *     summary: Create an image
 *     description: Only authorized users can upload images.
 *     tags: [Images]
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
 *               - imageFile
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageFile:
 *                 type: string
 *                 format: binary
 *             example:
 *               title: Sample Image
 *               description: A description of the image
 *               tags: ["tag1", "tag2"]
 *               imageFile: file
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Image'
 *       "400":
 *         description: Bad Request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all images
 *     description: Retrieve a list of images based on filters.
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Image title filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Image tags filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by query in the form of field:desc/asc (e.g., title:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of images
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
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
 *                     $ref: '#/components/schemas/Image'
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
 * /images/{id}:
 *   get:
 *     summary: Get an image
 *     description: Fetch a single image by ID.
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Image'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not Found
 *
 *   patch:
 *     summary: Update an image
 *     description: Only authorized users can update image details.
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image id
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
 *               title: Updated Image Title
 *               description: Updated description of the image
 *               tags: ["updatedTag1", "updatedTag2"]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Image'
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
 *     summary: Delete an image
 *     description: Only authorized users can delete images.
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image id
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
 * /images/tags:
 *   get:
 *     summary: Get all unique tags
 *     description: Retrieve a list of all unique tags associated with images.
 *     tags: [Images]
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
 * /images/tags-belongs-to-schools:
 *   get:
 *     summary: Get tags based on school ID
 *     description: Retrieve a list of unique tags associated with images. If the user has a school ID, only tags for that school are retrieved. If not, tags from repoManager users are retrieved.
 *     tags: [Images]
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
