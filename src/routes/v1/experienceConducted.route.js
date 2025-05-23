const express = require("express");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const { experienceConductedValidation } = require("../../validations");
const { ExperienceConductedController } = require("../../controllers");

const router = express.Router();

router
  .route("/")
  .post(
    auth("manageSession"),
    validate(experienceConductedValidation.createExperienceConducted),
    ExperienceConductedController.createExperienceConducted
  )
  .get(
    auth("manageSession"),
    validate(experienceConductedValidation.getExperienceConducted),
    ExperienceConductedController.getAllExperienceConducted
  );

router
  .route("/:experienceId")
  .get(
    auth("manageSession"),
    validate(experienceConductedValidation.getByIdExperienceConducted),
    ExperienceConductedController.getExperienceConductedById
  )
  .patch(
    auth("manageSession"),
    validate(experienceConductedValidation.updateExperienceConducted),
    ExperienceConductedController.updateExperienceConductedById
  )
  .delete(
    auth("manageSession"),
    validate(experienceConductedValidation.deleteExperienceConducted),
    ExperienceConductedController.deleteExperienceConductedById
  );

router
  .route("/:experience_conducted_id/performance-report")
  .get(
    auth("manageSession"),
    validate(experienceConductedValidation.generatePerformanceReport),
    ExperienceConductedController.generatePerformanceReport
  );
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: ExperiencesConducted
 *   description: Experience management and retrieval
 */

/**
 * @swagger
 * /experience_conducted:
 *   post:
 *     summary: Create a new experience
 *     description: Create a new experience with the provided details.
 *     tags: [ExperiencesConducted]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExperienceConducted'
 *           examples:
 *             example1:
 *               value:
 *                 sessionID: 6602acd7e7b6cd634b19b6e9
 *                 classStartTime: 2024-04-17T08:00:00Z
 *                 classEndTime: 2024-04-17T10:00:00Z
 *                 totalStudentsAttended: 30
 *                 conductedDate: 2024-04-17T00:00:00Z
 *                 totalDevicesActive: 25
 *                 classConductedHours: "2"
 *                 feedback: "Session went well"
 *                 sectionID: 5ebac534954b54139806c115
 *                 gradeID: 5ebac534954b54139806c116
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
 *     summary: Get all experiences
 *     description: Retrieve all experiences.
 *     tags: [ExperiencesConducted]
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
 *                 $ref: '#/components/schemas/ExperienceConducted'
 *             example:
 *               - sessionID: 6602acd7e7b6cd634b19b6e9
 *                 teacherID: 5ebac534954b54139806c113
 *                 classStartTime: 2024-04-17T08:00:00Z
 *                 classEndTime: 2024-04-17T10:00:00Z
 *                 totalStudentsAttended: 30
 *                 schoolID: 5ebac534954b54139806c114
 *                 conductedDate: 2024-04-17T00:00:00Z
 *                 totalDevicesActive: 25
 *                 classConductedHours: "2"
 *                 feedback: "Session went well"
 *                 sectionID: 5ebac534954b54139806c115
 *                 gradeID: 5ebac534954b54139806c116
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /experience_conducted/{experienceId}:
 *   get:
 *     summary: Get an experience by ID
 *     description: Retrieve an experience by its ID.
 *     tags: [ExperiencesConducted]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the experience to retrieve
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExperienceConducted'
 *             example:
 *               sessionID: 6602acd7e7b6cd634b19b6e9
 *               teacherID: 5ebac534954b54139806c113
 *               classStartTime: 2024-04-17T08:00:00Z
 *               classEndTime: 2024-04-17T10:00:00Z
 *               totalStudentsAttended: 30
 *               schoolID: 5ebac534954b54139806c114
 *               conductedDate: 2024-04-17T00:00:00Z
 *               totalDevicesActive: 25
 *               classConductedHours: "2"
 *               feedback: "Session went well"
 *               sectionID: 5ebac534954b54139806c115
 *               gradeID: 5ebac534954b54139806c116
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     summary: Update an experience by ID
 *     description: Update an experience with the provided details.
 *     tags: [ExperiencesConducted]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the experience to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExperienceConducted'
 *           examples:
 *             example1:
 *               value:
 *                 classStartTime: "2024-05-17T08:00:00Z"
 *                 classEndTime: "2024-05-17T10:00:00Z"
 *                 totalStudentsAttended: "35"
 *                 feedback: "Session feedback updated"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExperienceConducted'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete an experience by ID
 *     description: Delete an experience by its ID.
 *     tags: [ExperiencesConducted]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the experience to delete
 *     responses:
 *       204:
 *         description: Successful operation
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /experience_conducted/{experience_conducted_id}/performance-report:
 *   get:
 *     summary: Generate performance report
 *     description: Generate an Excel sheet for performance reports based on the experienceConductedID.
 *     tags: [ExperiencesConducted]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experience_conducted_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the experience conducted
 *     responses:
 *       200:
 *         description: Excel file generated
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
