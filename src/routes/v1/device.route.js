const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { deviceValidation } = require('../../validations');
const { deviceController } = require('../../controllers');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management and retrieval
 */

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Create a device
 *     description: Only authorized users can create devices.
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: string
 *                 description: The unique identifier for the device.
 *               schoolID:
 *                 type: string
 *                 description: The identifier of the school associated with this device, provide a school device ID.
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       "400":
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all devices
 *     description: Retrieves a list of devices based on filters.
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceID
 *         schema:
 *           type: string
 *         description: Device ID filter
 *       - in: query
 *         name: schoolID
 *         schema:
 *           type: string
 *         description: School ID filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of devices per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *       "401":
 *         description: Unauthorized
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Forbidden
 *         $ref: '#/components/responses/Forbidden'
 */

router
  .route('/')
  .post(validate(deviceValidation.createDevice), deviceController.createDevice)
  .get(auth('commonPermission'), validate(deviceValidation.getDevices), deviceController.getDevices);

/**
 * @swagger
 * /devices/{deviceId}:
 *   get:
 *     summary: Get a device
 *     description: Fetches a single device by ID.
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *       "401":
 *         description: Unauthorized
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Forbidden
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Not Found
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a device
 *     description: Only authorized users can update device details.
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isBlocked:
 *                 type: boolean
 *                 description: Indicates whether the device is blocked.
 *               isActive:
 *                 type: boolean
 *                 description: Indicates whether the device is active.
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *       "400":
 *         description: Bad Request
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         description: Unauthorized
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Forbidden
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Not Found
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a device
 *     description: Only authorized users can delete devices.
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         description: Unauthorized
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Forbidden
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Not Found
 *         $ref: '#/components/responses/NotFound'
 */

router
  .route('/:deviceId')
  .get(auth('commonPermission'), validate(deviceValidation.getDeviceById), deviceController.getDeviceById)
  .patch(auth('commonPermission'), validate(deviceValidation.updateDeviceById), deviceController.updateDeviceById)
  .delete(auth('commonPermission'), validate(deviceValidation.deleteDeviceById), deviceController.deleteDeviceById);

module.exports = router;
