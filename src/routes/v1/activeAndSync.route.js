const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const deviceAuth = require("../../middlewares/device");
const { activeAndSyncController } = require("../../controllers");
const { activeAndSyncValidation } = require("../../validations");

const router = express.Router();

router
  .route("/start")
  .post(auth("manageSession"), activeAndSyncController.provokeActiveAndSync);

router
  .route("/stop")
  .post(auth("manageSession"), activeAndSyncController.revokeActiveAndSync);

router
  .route("/device_connecting")
  .patch(
    deviceAuth,
    validate(activeAndSyncValidation.updateActiveAndSyncTableSchema),
    activeAndSyncController.updateActiveAndSyncTable
  );

router
  .route("/")
  .get(
    auth("commonPermission"),
    activeAndSyncController.getActiveAndSyncTables
  );

router
  .route("/live_status")
  .patch(auth("manageSession"), activeAndSyncController.updateStartStop);
router
  .route("/live_tracking")
  .get(deviceAuth, activeAndSyncController.liveTrack);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: ActiveAndSync
 *   description: Active and Sync management and retrieval
 */

/**
 * @swagger
 * /device_sync/start:
 *   post:
 *     summary: Create an Active and Sync entry
 *     description: Only authorized users can create Active and Sync entries.
 *     tags: [ActiveAndSync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Active and Sync entries provoked successfully."
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /device_sync/stop:
 *   post:
 *     summary: Revoke an Active and Sync entry
 *     description: Only authorized users can Revoke Active and Sync entries.
 *     tags: [ActiveAndSync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Active and Sync entries revoked successfully."
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /device_sync:
 *   get:
 *     summary: Get all Active and Sync entries
 *     description: Retrieves a list of Active and Sync entries based on filters.
 *     tags: [ActiveAndSync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Name filter for Active and Sync entries
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Role filter for Active and Sync entries
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by query in the form of field:(desc|asc) (ex. fieldName:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of Active and Sync entries
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
 *                     $ref: '#/components/schemas/ActiveAndSync'
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
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /device_sync/device_connecting:
 *   patch:
 *     summary: Update an Active and Sync entry by ID
 *     description: Only authorized users can update Active and Sync entries.
 *     tags: [ActiveAndSync]
 *     security:
 *       - DeviceIDAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               isSynced:
 *                 type: boolean
 *               isCompleted:
 *                 type: boolean
 *           example:
 *             isActive: false
 *             isSynced: false
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *       "201":
 *         description: updated
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /device_sync/live_status:
 *   patch:
 *     summary: Update start and stop status
 *     description: Update the start and stop status for a device.
 *     tags: [ActiveAndSync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isStart:
 *                 type: boolean
 *               isStop:
 *                 type: boolean
 *               experienceId:
 *                 type: string
 *               gradeId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *           example:
 *             isStart: true
 *             isStop: false
 *             experienceId: 65f2e4f2c39b219a52975997
 *             gradeId: 65f2e4f2c39b219a52975997
 *             sectionId: 65f2e4f2c39b219a52975997
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /device_sync/live_tracking:
 *   get:
 *     summary: Update live tracking status
 *     description: Update the live tracking status of a device.
 *     tags: [ActiveAndSync]
 *     security:
 *       - DeviceIDAuth: []
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       '201':
 *         description: Updated
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
