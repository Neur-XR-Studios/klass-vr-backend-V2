const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const { simulationValidation } = require("../../validations");
const { simulationController } = require("../../controllers");

const router = express.Router();

router
  .route("/")
  .post(
    auth("manageSimulations"),
    validate(simulationValidation.createSimulation),
    simulationController.createSimulation
  )
  .get(
    auth("getSimulations"),
    validate(simulationValidation.getSimulations),
    simulationController.getSimulations
  );

router
  .route("/:simulationId")
  .get(
    auth("getSimulations"),
    validate(simulationValidation.getSimulation),
    simulationController.getSimulation
  )
  .patch(
    auth("manageSimulations"),
    validate(simulationValidation.updateSimulation),
    simulationController.updateSimulation
  )
  .delete(
    auth("manageSimulations"),
    validate(simulationValidation.deleteSimulation),
    simulationController.deleteSimulation
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Simulations
 *   description: Simulation management and retrieval
 */

/**
 * @swagger
 * /simulations:
 *   post:
 *     summary: Create a simulation
 *     description: Only admins can create simulations.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - simulationURL
 *               - title
 *             properties:
 *               simulationURL:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               displayTime:
 *                 type: string
 *               subject:
 *                 type: string
 *             example:
 *               simulationURL: "http://example.com/simulation"
 *               title: "Sample Simulation"
 *               description: "This is a sample simulation."
 *               displayTime: "10:00"
 *               subject: "Physics"
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Simulation'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get all simulations
 *     description: Only admins can retrieve all simulations.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Simulation title
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Simulation subject
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by query in the form of field:desc/asc (ex. title:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of results per page
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
 *                     $ref: '#/components/schemas/Simulation'
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
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /simulations/{simulationId}:
 *   get:
 *     summary: Get a simulation
 *     description: Fetches a specific simulation by ID.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Simulation ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Simulation'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a simulation
 *     description: Updates a specific simulation by ID.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Simulation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               simulationURL:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               displayTime:
 *                 type: string
 *               subject:
 *                 type: string
 *             example:
 *               simulationURL: "http://example.com/simulation-updated"
 *               title: "Updated Simulation"
 *               description: "This is an updated simulation."
 *               displayTime: "15:00"
 *               subject: "Chemistry"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Simulation'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a simulation
 *     description: Deletes a specific simulation by ID.
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Simulation ID
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
