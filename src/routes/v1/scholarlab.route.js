const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const scholarlabValidation = require('../../validations/scholarlab.validation');
const scholarlabController = require('../../controllers/scholarlab.controller');

const router = express.Router();

router
    .route('/simulations')
    .get(
        auth('getSimulations'),
        validate(scholarlabValidation.getSimulations),
        scholarlabController.getSimulations
    );

router
    .route('/launch')
    .post(
        auth('getSimulations'),
        validate(scholarlabValidation.launchSimulation),
        scholarlabController.launchSimulation
    );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Scholarlab
 *   description: Scholarlab WebGL simulation integration
 */

/**
 * @swagger
 * /scholarlab/simulations:
 *   get:
 *     summary: Get available Scholarlab simulations
 *     description: Fetch simulations available for the authenticated user based on grade
 *     tags: [Scholarlab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grade
 *         required: true
 *         schema:
 *           type: string
 *         description: Grade for simulations (e.g., "9", "10")
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *           default: Science
 *         description: Subject for simulations
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 simulations:
 *                   type: array
 *       "401":
 *         description: Unauthorized
 *       "400":
 *         description: Bad Request - Missing grade parameter
 */

/**
 * @swagger
 * /scholarlab/launch:
 *   post:
 *     summary: Launch a Scholarlab simulation
 *     description: Generate encrypted launch URL for a specific simulation
 *     tags: [Scholarlab]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - simulationId
 *               - simulationUrl
 *               - grade
 *             properties:
 *               simulationId:
 *                 type: string
 *                 description: Unique simulation identifier
 *               simulationUrl:
 *                 type: string
 *                 format: uri
 *                 description: Base WebGL URL for the simulation
 *               grade:
 *                 type: string
 *                 description: Grade for the simulation
 *               subject:
 *                 type: string
 *                 default: Science
 *                 description: Subject for the simulation
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 launchUrl:
 *                   type: string
 *                   description: Encrypted WebGL launch URL
 *                 session:
 *                   type: object
 *       "401":
 *         description: Unauthorized
 *       "400":
 *         description: Bad Request - Missing required fields
 */
