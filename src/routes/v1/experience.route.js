const express = require('express');
const validate = require('../../middlewares/validate');
const deviceAuth = require('../../middlewares/device');
const experienceController = require('../../controllers/experience.controller');
const experienceValidation = require('../../validations/experience.validation');

const router = express.Router();

router
  .route('/')
  .get(
    deviceAuth,
    validate(experienceValidation.getDeployedSessionsWithAssessmentsAndContentsValidation),
    experienceController.getDeployedSessionsWithAssessmentsAndContents,
  );
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Experience
 *   description: Session management and retrieval
 */

/**
 * @swagger
 * /experience:
 *   get:
 *     summary: Get deployed sessions with assessments and contents
 *     description: Retrieve all deployed sessions along with their assessments and contents.
 *     tags:
 *       - Experience
 *     security:
 *       - DeviceIDAuth: []
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */
