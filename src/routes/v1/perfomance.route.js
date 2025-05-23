const express = require("express");
const auth = require("../../middlewares/auth");
const deviceAuth = require("../../middlewares/device");
const validate = require("../../middlewares/validate");
const { perfomanceController } = require("../../controllers");
const { perfomanceValidation } = require("../../validations");

const router = express.Router();

router
  .route("/")
  .post(
    deviceAuth,
    validate(perfomanceValidation.createPerfomance),
    perfomanceController.createPerfomance
  );

router
  .route("/search")
  .get(
    auth("commonPermission"),
    perfomanceController.searchStudentsBySectionAndGrade
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Performance
 *   description: API endpoints for managing student performance
 */

/**
 * @swagger
 * /performance:
 *   post:
 *     summary: Create a new performance record
 *     description: Create a new performance record with provided details
 *     tags: [Performance]
 *     security:
 *       - DeviceIDAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PerformanceInput'
 *     responses:
 *       '200':
 *         description: Performance record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Performance'
 */

/**
 * @swagger
 * /performance/search:
 *   get:
 *     summary: Search for students by sectionId, gradeId, and schoolId
 *     description: Retrieve a list of student performances based on sectionId, gradeId, and schoolId
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *         description: The ID of the section
 *       - in: query
 *         name: gradeId
 *         schema:
 *           type: string
 *         description: The ID of the grade
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: The ID of the school
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Performance'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PerformanceInput:
 *       type: object
 *       properties:
 *         studentID:
 *           type: string
 *           description: The ID of the student
 *         experienceConductedID:
 *           type: string
 *           description: The ID of the experience conducted
 *         schoolId:
 *           type: string
 *           description: The ID of the school
 *         sectionID:
 *           type: string
 *           description: The ID of the section
 *         gradeID:
 *           type: string
 *           description: The ID of the grade
 *         score:
 *           type: number
 *           description: The score of the student
 *     Performance:
 *       type: object
 *       properties:
 *         studentID:
 *           type: string
 *           description: The ID of the student
 *         experienceConductedID:
 *           type: string
 *           description: The ID of the experience conducted
 *         schoolId:
 *           type: string
 *           description: The ID of the school
 *         sectionID:
 *           type: string
 *           description: The ID of the section
 *         gradeID:
 *           type: string
 *           description: The ID of the grade
 *         score:
 *           type: number
 *           description: The score of the student
 */
