const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleController = require('../../controllers/role.controller');
const roleValidation = require('../../validations/role.validation');

const router = express.Router();

router.route('/').get(auth('manageRoles'), roleController.getAllRoles);

router
  .route('/:roleId/permissions')
  .patch(auth('manageRoles'), validate(roleValidation.updateRolePermissions), roleController.updateRolePermissions);

module.exports = router;

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     description: Get all roles with their permissions.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: A list of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   patch:
 *     summary: Update permissions of a role
 *     description: Update permissions of a role by providing the role ID.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       "200":
 *         description: Role permissions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
