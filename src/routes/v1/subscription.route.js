const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const subscriptionValidation = require('../../validations/subscription.validation');
const subscriptionController = require('../../controllers/subscription.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management and retrieval
 */

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a subscription
 *     description: Only admin users can create subscriptions.
 *     tags: [Subscription]
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 */

router.post(
  '/',
  auth('manageSubscriptions'),
  validate(subscriptionValidation.createSubscriptionSchema),
  subscriptionController.create,
);

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     description: All authorized users can retrieve all subscriptions.
 *     tags:
 *       - Subscription
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
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */

router.get('/', auth('manageSubscriptions'), subscriptionController.getAll);

/**
 * @swagger
 * /subscriptions/{subscriptionId}:
 *   get:
 *     summary: Retrieve a subscription by ID
 *     description: Retrieve a specific subscription by providing the subscription ID.
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *       summary: Update a subscription by ID
 *       description: Update a specific subscription by providing the subscription ID.
 *       tags: [Subscription]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: subscriptionId
 *           required: true
 *           schema:
 *             type: string
 *           description: Subscription ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date
 *                 endDate:
 *                   type: string
 *                   format: date
 *                 isActive:
 *                   type: boolean
 *                 description:
 *                   type: string
 *               required:
 *                 - name
 *                 - startDate
 *                 - endDate
 *                 - isActive
 *       responses:
 *         '200':
 *           description: OK
 *           content:
 *             application/json:
 *               schema:
 *         '401':
 *           $ref: '#/components/responses/Unauthorized'
 *         '403':
 *           $ref: '#/components/responses/Forbidden'
 *         '404':
 *           $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a subscription by ID
 *     description: Delete a specific subscription by providing the subscription ID.
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       '204':
 *         description: No Content
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */

router
  .route('/:subscriptionId')
  .get(
    auth('manageSubscriptions'),
    validate(subscriptionValidation.getSubscriptionByIdSchema),
    subscriptionController.getById,
  )
  .patch(
    auth('manageSubscriptions'),
    validate(subscriptionValidation.updateSubscriptionSchema),
    subscriptionController.update,
  )
  .delete(
    auth('manageSubscriptions'),
    validate(subscriptionValidation.deleteSubscriptionSchema),
    subscriptionController.remove,
  );

module.exports = router;
