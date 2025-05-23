const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const sectionValidation = require("../../validations/section.validation");
const sectionController = require("../../controllers/section.controller");

const router = express.Router();

router
  .route("/")
  .post(
    auth("commonPermission"),
    validate(sectionValidation.createSection),
    sectionController.createSection
  )
  .get(
    auth("commonPermission"),
    validate(sectionValidation.getSections),
    sectionController.getSections
  );

router
  .route("/:sectionId")
  .get(
    auth("commonPermission"),
    validate(sectionValidation.getSection),
    sectionController.getSection
  )
  .patch(
    auth("commonPermission"),
    validate(sectionValidation.updateSection),
    sectionController.updateSection
  )
  .delete(
    auth("commonPermission"),
    validate(sectionValidation.deleteSection),
    sectionController.deleteSection
  );

router
  .route("/:gradeId/grade")
  .get(
    auth("commonPermission"),
    validate(sectionValidation.getSectionByGrade),
    sectionController.getSectionByGrade
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: API endpoints for managing sections
 */

/**
 * @swagger
 * definitions:
 *   Section:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: Name of the section
 *       gradeId:
 *         type: string
 *         description: ID of the associated grade
 *       schoolId:
 *         type: string
 *         description: ID of the associated school
 */

/**
 * @swagger
 * /sections:
 *   post:
 *     summary: Create a new section
 *     description: Create a new section with provided details
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Section A
 *               gradeId:
 *                 type: string
 *                 example: "611f37803e2c780015d6f406"
 *     responses:
 *       '201':
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Section'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /sections:
 *   get:
 *     summary: Get all sections
 *     description: Retrieve a list of sections
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Sections successfully retrieved
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Section'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /sections/{sectionId}:
 *   get:
 *     summary: Get section by ID
 *     description: Retrieve a section by its ID
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       '200':
 *         description: Section successfully retrieved
 *         schema:
 *           $ref: '#/definitions/Section'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /sections/{gradeId}/grade:
 *   get:
 *     summary: Get section by Grade ID
 *     description: Retrieve a section by its Grade ID
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Grade ID
 *     responses:
 *       '200':
 *         description: Section successfully retrieved
 *         schema:
 *           $ref: '#/definitions/Section'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /sections/{sectionId}:
 *   patch:
 *     summary: Update section details
 *     description: Update details of a section by its ID
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Section'
 *           example:
 *             name: Updated Section Name
 *     responses:
 *       '200':
 *         description: Section updated successfully
 *         schema:
 *           $ref: '#/definitions/Section'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /sections/{sectionId}:
 *   delete:
 *     summary: Delete section
 *     description: Delete a section by its ID
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       '204':
 *         description: Section deleted successfully
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
