const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const studentValidation = require("../../validations/student.validation");
const studentController = require("../../controllers/student.controller");
const multer = require("multer");

const router = express.Router();
const upload = multer();

router
  .route("/")
  .post(
    auth("commonPermission"),
    validate(studentValidation.createStudent),
    studentController.createStudent
  )
  .get(
    auth("commonPermission"),
    validate(studentValidation.getStudents),
    studentController.getStudents
  );

router
  .route("/:studentId")
  .get(
    auth("commonPermission"),
    validate(studentValidation.getStudent),
    studentController.getStudent
  )
  .patch(
    auth("commonPermission"),
    validate(studentValidation.updateStudent),
    studentController.updateStudent
  )
  .delete(
    auth("commonPermission"),
    validate(studentValidation.deleteStudent),
    studentController.deleteStudent
  );

router
  .route("/export")
  .post(
    auth("commonPermission"),
    validate(studentValidation.validateExportStudents),
    studentController.exportStudents
  );

router
  .route("/import")
  .post(
    auth("commonPermission"),
    upload.single("file"),
    validate(studentValidation.importStudents),
    studentController.importStudentsFromExcel
  );

router
  .route("/search")
  .post(
    auth("commonPermission"),
    validate(studentValidation.searchStudents),
    studentController.searchStudentsBySectionAndGrade
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: API endpoints for managing students
 */

/**
 * @swagger
 * definitions:
 *   Student:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: Name of the student
 *       studentId:
 *         type: string
 *         description: ID of the student
 *       schoolId:
 *         type: string
 *         description: ID of the associated school
 *       sectionId:
 *         type: string
 *         description: ID of the associated section
 *       gradeId:
 *         type: string
 *         description: ID of the associated grade
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     description: Create a new student with provided details
 *     tags: [Students]
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
 *                 description: Name of the student
 *               sectionId:
 *                 type: string
 *                 description: ID of the associated section
 *               gradeId:
 *                 type: string
 *                 description: ID of the associated grade
 *           example:
 *             name: John Doe
 *             sectionId: 611f37803e2c780015d6f408
 *             gradeId: 611f37803e2c780015d6f406
 *     responses:
 *       '201':
 *         description: Student created successfully
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     description: Retrieve a list of students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Students successfully retrieved
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Student'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /students/{studentId}:
 *   get:
 *     summary: Get student by ID
 *     description: Retrieve a student by its ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       '200':
 *         description: Student successfully retrieved
 *         schema:
 *           $ref: '#/definitions/Student'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /students/{studentId}:
 *   patch:
 *     summary: Update student details
 *     description: Update details of a student by its ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Student'
 *           example:
 *             name: Updated Student Name
 *     responses:
 *       '200':
 *         description: Student updated successfully
 *         schema:
 *           $ref: '#/definitions/Student'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /students/{studentId}:
 *   delete:
 *     summary: Delete student
 *     description: Delete a student by its ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       '204':
 *         description: Student deleted successfully
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /students/export:
 *   post:
 *     summary: Export students to Excel
 *     description: Export students' ID and name to an Excel file
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gradeId:
 *                 type: string
 *                 description: ID of the grade
 *               sectionId:
 *                 type: string
 *                 description: ID of the section
 *     responses:
 *       '200':
 *         description: Students exported to Excel successfully
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /students/import:
 *   post:
 *     summary: Import students from Excel
 *     description: Import students' names from an Excel file and add them to the specified grade and section
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               gradeId:
 *                 type: string
 *                 description: ID of the grade to import students into
 *               sectionId:
 *                 type: string
 *                 description: ID of the section to import students into
 *     responses:
 *       '201':
 *         description: Students imported successfully
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /students/search:
 *   post:
 *     summary: Search students by sectionId and gradeId
 *     description: Retrieve a list of students based on the provided sectionId and gradeId
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gradeId:
 *                 type: string
 *                 description: ID of the grade to import students into
 *               sectionId:
 *                 type: string
 *                 description: ID of the section to import students into
 *     responses:
 *       '200':
 *         description: Students successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */
