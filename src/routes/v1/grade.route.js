const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const gradeValidation = require('../../validations/grade.validation');
const gradeController = require('../../controllers/grade.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('commonPermission'), validate(gradeValidation.createGrade), gradeController.createGrade)
  .get(auth('commonPermission'), validate(gradeValidation.getGrades), gradeController.getGrades);

router
  .route('/:gradeId')
  .get(auth('commonPermission'), validate(gradeValidation.getGrade), gradeController.getGrade)
  .patch(auth('commonPermission'), validate(gradeValidation.updateGrade), gradeController.updateGrade)
  .delete(auth('commonPermission'), validate(gradeValidation.deleteGrade), gradeController.deleteGrade);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Grades
 *   description: API endpoints for managing grades
 */

/**
 * @swagger
 * /grades:
 *   post:
 *     summary: Create a new grade
 *     description: Create a new grade with provided details
 *     tags: [Grades]
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
 *     responses:
 *       '201':
 *         description: Grade created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 schoolId:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /grades:
 *   get:
 *     summary: Get all grades
 *     description: Retrieve a list of grades
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Grades successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   schoolId:
 *                     type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /grades/{gradeId}:
 *   get:
 *     summary: Get grade by ID
 *     description: Retrieve a grade by its ID
 *     tags: [Grades]
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
 *         description: Grade successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 schoolId:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /grades/{gradeId}:
 *   patch:
 *     summary: Update grade details
 *     description: Update details of a grade by its ID
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Grade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Grade updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 schoolId:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /grades/{gradeId}:
 *   delete:
 *     summary: Delete grade
 *     description: Delete a grade by its ID
 *     tags: [Grades]
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
 *       '204':
 *         description: Grade deleted successfully
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
