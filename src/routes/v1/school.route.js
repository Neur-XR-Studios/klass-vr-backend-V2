const express = require("express");
const validate = require("../../middlewares/validate");
const schoolValidation = require("../../validations/school.validation");
const schoolController = require("../../controllers/school.controller");

const router = express.Router();

router.post(
  "/",
  validate(schoolValidation.createSchoolSchema),
  schoolController.createSchool
);
router.get(
  "/",
  validate(schoolValidation.getAllSchoolsSchema),
  schoolController.getAllSchools
);
router.get(
  "/:schoolId",
  validate(schoolValidation.getSchoolSchema),
  schoolController.getSchoolById
);
router.patch(
  "/:schoolId",
  validate(schoolValidation.updateSchoolSchema),
  schoolController.updateSchoolById
);
router.delete(
  "/:schoolId",
  validate(schoolValidation.deleteSchoolSchema),
  schoolController.deleteSchoolById
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: School
 *   description: School management and retrieval
 */

/**
 * @swagger
 * /schools:
 *   post:
 *     summary: Create a new school
 *     description: Create a new school with the provided details and create users with specified roles.
 *     tags: [School]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolName:
 *                 type: string
 *                 example: Example School
 *               schoolAddress:
 *                 type: string
 *                 example: 123 Main Street
 *               schoolType:
 *                 type: string
 *                 example: Public
 *               gradeLevelsServed:
 *                 type: string
 *                 example: K-12
 *               schoolDistrict:
 *                 type: string
 *                 example: Example District
 *               schoolIdentificationNumber:
 *                 type: string
 *                 example: 1234567890
 *               schoolEmail:
 *                 type: string
 *                 format: email
 *                 example: example@example.com
 *               schoolPhoneNumber:
 *                 type: string
 *                 example: +1234567890
 *               subscriptionName:
 *                 type: string
 *                 example: Premium Plan
 *               maxAllowedDevice:
 *                 type: integer
 *                 example: 30
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: john@example.com
 *                     password:
 *                       type: string
 *                       example: mySecurePassword123
 *                     role:
 *                       type: string
 *                       enum: [superadmin, admin, teacher]
 *                       example: admin
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     summary: Get all schools
 *     description: Retrieve all schools.
 *     tags:
 *       - School
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#'
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /schools/{schoolId}:
 *   get:
 *     summary: Get a school by ID
 *     description: Retrieve a school by its ID.
 *     tags:
 *       - School
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the school to retrieve
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     summary: Update a school by ID
 *     description: Update a school's subscription name by its ID.
 *     tags:
 *       - School
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the school to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptionName:
 *                 type: string
 *                 example: New Subscription Name
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a school by ID
 *     description: Delete a school by its ID.
 *     tags:
 *       - School
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the school to delete
 *     responses:
 *       204:
 *         description: Successful operation
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
