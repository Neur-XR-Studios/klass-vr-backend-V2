const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const sessionValidation = require('../../validations/session.validation');
const sessionController = require('../../controllers/session.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageSession'), validate(sessionValidation.createSession), sessionController.createSession)
  .get(auth('commonPermission'), validate(sessionValidation.getSessions), sessionController.getSessions);

router
  .route('/:sessionId')
  .get(auth('manageSession'), validate(sessionValidation.getSession), sessionController.getSession)
  .patch(auth('manageSession'), validate(sessionValidation.updateSession), sessionController.updateSession)
  .delete(auth('manageSession'), validate(sessionValidation.deleteSession), sessionController.deleteSession);

router
  .route('/deploy/:sessionId')
  .patch(auth('manageSession'), validate(sessionValidation.deploySessionValidation), sessionController.deploySession);

router
  .route('/filter')
  .post(auth('manageSession'), validate(sessionValidation.filterSessions), sessionController.filterSessions);

router.route('/users').post(auth('manageSession'), sessionController.queryUserSessions);
router.route('/drafts').post(auth('manageSession'), sessionController.queryDrafts);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Session
 *   description: Session management and retrieval
 */

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a session
 *     description: Only teachers can create sessions.
 *     tags: [Session]
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
 *                 example : Ancient History
 *               sessionTimeAndDate:
 *                 type: string
 *                 format: date-time
 *               sessionStartedTime:
 *                 type: string
 *                 format: date-time
 *               sessionEndedTime:
 *                 type: string
 *                 format: date-time
 *               grade:
 *                 type: string
 *               sessionStatus:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               subject:
 *                 type: string
 *               feedback:
 *                 type: string
 *               stepperNo:
 *                 type: number
 *               sessionDuration:
 *                 type: number
 *               isDraft:
 *                 type: boolean
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
 *
 *   get:
 *     summary: Get all sessions
 *     description: All authorized users can retrieve all sessions.
 *     tags:
 *       - Session
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
 *                 $ref: '#/components/Session'
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /sessions/{sessionId}:
 *   get:
 *     summary: Retrieve a session by ID
 *     description: Retrieve a specific session by providing the session ID.
 *     tags: [Session]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/Session'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *       summary: Update a session by ID
 *       description: Update a specific session by providing the session ID.
 *       tags: [Session]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: sessionId
 *           required: true
 *           schema:
 *             type: string
 *           description: Session ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionTimeAndDate:
 *                   type: string
 *                   format: date-time
 *                 sessionStartedTime:
 *                   type: string
 *                   format: date-time
 *                 sessionEndedTime:
 *                   type: string
 *                   format: date-time
 *                 grade:
 *                   type: string
 *                 sectionOrClass:
 *                   type: string
 *                 sessionStatus:
 *                   type: string
 *                   enum: ['pending', 'in progress', 'completed']
 *                 subject:
 *                   type: string
 *                 feedback:
 *                   type: string
 *                 stepperNo:
 *                   type: number
 *                 sessionDuration:
 *                   type: integer
 *                 isDraft:
 *                   type: boolean
 *               required:
 *                 - sessionTimeAndDate
 *                 - sessionStartedTime
 *                 - sessionEndedTime
 *                 - grade
 *                 - sectionOrClass
 *                 - sessionStatus
 *                 - subject
 *                 - feedback
 *                 - sessionDuration
 *       responses:
 *         "200":
 *           description: OK
 *           content:
 *             application/json:
 *               schema:
 *                  $ref: '#/components/Session'
 *         "401":
 *           $ref: '#/components/responses/Unauthorized'
 *         "403":
 *           $ref: '#/components/responses/Forbidden'
 *         "404":
 *           $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a session by ID
 *     description: Delete a specific session by providing the session ID.
 *     tags: [Session]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /sessions/deploy/{sessionId}:
 *   patch:
 *     summary: Deploy a session by ID
 *     description: Deploy a specific session by providing the session ID.
 *     tags: [Session]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/Session'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /sessions/filter:
 *   post:
 *     summary: Filter sessions based on criteria
 *     description: Retrieve sessions based on specified criteria.
 *     tags:
 *       - Session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Session'
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /sessions/users:
 *   post:
 *     summary: get the user created session
 *     description: Retrieve sessions based on the user.
 *     tags:
 *       - Session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Session'
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /sessions/drafts:
 *   post:
 *     summary: Retrieve sessions with drafts created by the logged-in user
 *     description: >
 *       Retrieve sessions with drafts based on the logged-in user. This endpoint fetches all sessions
 *       belonging to the authenticated user that have draft content or assessments associated with them.
 *       Draft sessions are those that have content or assessments marked as drafts.
 *     tags:
 *       - Session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       '401':
 *          $ref: '#/components/responses/Unauthorized'
 *       '403':
 *          $ref: '#/components/responses/Forbidden'
 */
