const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { dashboardController } = require('../../controllers');
const { perfomanceValidation } = require('../../validations');
/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints for dashboard data
 */

/**
 * @swagger
 * /dashboard/systemadmin:
 *   get:
 *     summary: Get dashboard data
 *     description: Retrieve all data required for the dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalNoOfSchools:
 *                   type: integer
 *                   description: Total number of schools
 *                 expiredLicensingInOrder:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: User ID
 *                       subscriptionRemainingDays:
 *                         type: number
 *                         description: Remaining days for subscription
 *                 clientSchoolPerfomance:
 *                   type: object
 *                   properties:
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                         description: School names
 *                     data:
 *                       type: array
 *                       items:
 *                         type: number
 *                         description: Average scores
 *                 totalNoOf3dModels:
 *                   type: integer
 *                   description: Total number of 3D models
 *                 totalNoOf360Videos:
 *                   type: integer
 *                   description: Total number of 360 videos
 *                 totalNoOfUsersWithRole:
 *                   type: object
 *                   properties:
 *                     totalNoOfTeacher:
 *                       type: integer
 *                       description: Total number of teachers
 *                     totalNoOfAdmin:
 *                       type: integer
 *                       description: Total number of admins
 *                     totalNoOfSuperAdmin:
 *                       type: integer
 *                       description: Total number of superadmins
 *                     totalNoOfRepoTeam:
 *                       type: integer
 *                       description: Total number of repo managers
 *                 totalNoOfVrDevice:
 *                   type: integer
 *                   description: Total number of VR devices
 *                 totalNoOfExperienceCreated:
 *                   type: integer
 *                   description: Total number of experiences created
 *                 totalNoOfActiveAndDeactiveSchools:
 *                   type: object
 *                   properties:
 *                     totalNoOfActiveSchools:
 *                       type: integer
 *                       description: Total number of active schools
 *                     totalNoOfDeactiveSchools:
 *                       type: integer
 *                       description: Total number of deactive schools
 */

router.get('/systemadmin', auth('commonPermission'), dashboardController.getSystemAdminDashboardData);

/**
 * @swagger
 * /dashboard/teacher:
 *   get:
 *     summary: Get class assessment performance data
 *     description: Retrieve class assessment performance data for all classes or for a specific grade and section
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: gradeId
 *         in: query
 *         description: Grade ID
 *         required: false
 *         type: string
 *       - name: sectionId
 *         in: query
 *         description: Section ID
 *         required: false
 *         type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classPerformance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gradeID:
 *                         type: string
 *                         description: Grade ID
 *                       sectionID:
 *                         type: string
 *                         description: Section ID
 *                       totalScore:
 *                         type: number
 *                         description: Total score of the class
 *                       totalStudents:
 *                         type: number
 *                         description: Total number of students in the class
 */

router.get(
  '/teacher',
  auth('commonPermission'),
  validate(perfomanceValidation.getTeacherDashboardData),
  dashboardController.getTeacherDashboardData,
);

/**
 * @swagger
 * /dashboard/grade_section_performance:
 *   get:
 *     summary: Get grade and section assessment performance
 *     description: Retrieve the assessment performance for each grade and section in a school
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Grade and section assessment performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       totalScore:
 *                         type: number
 *                         description: Total score
 *                       totalStudents:
 *                         type: number
 *                         description: Total number of students
 *                       gradeID:
 *                         type: string
 *                         description: ID of the grade
 *                       gradeName:
 *                         type: string
 *                         description: Name of the grade
 *                       sectionID:
 *                         type: string
 *                         description: ID of the section
 *                       sectionName:
 *                         type: string
 *                         description: Name of the section
 *       "500":
 *         description: Internal server error
 */
router.get('/grade_section_performance', auth('commonPermission'), dashboardController.getGradeSectionAssessmentPerformance);
router.get('/grade_section_performance_numbers', auth('commonPermission'), dashboardController.getTeacherDashboardDataNumbers);


/**
 * @swagger
 * /dashboard/super_admin:
 *   get:
 *     summary: Get Super Admin Dashboard Data
 *     description: Retrieve dashboard data for the super admin
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: ID of the teacher
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalNoOfExperienceCreatedByTeacher:
 *                   type: number
 *                   description: Total number of experiences created by the teacher
 *                 totalNoOfExperienceDeployedTeacher:
 *                   type: number
 *                   description: Total number of experiences deployed by the teacher
 *                 totalNoOfAssessmentCreatedByTeacher:
 *                   type: number
 *                   description: Total number of assessments created by the teacher
 *                 overallExperienceDeployedByTeacher:
 *                   type: number
 *                   description: Overall experiences deployed by the teacher
 *                 totalNoOfExperienceByTeacher:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date
 *                       count:
 *                         type: number
 *                         description: Count of experiences created by the teacher on that date
 *                   description: Total number of experiences created by the teacher, grouped by date
 *                 ExperienceDeployedByTeacher:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date
 *                       count:
 *                         type: number
 *                         description: Count of experiences deployed by the teacher on that date
 *                   description: Total number of experiences deployed by the teacher, grouped by date
 *                 AssessmentCreatedByTeacher:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date
 *                       count:
 *                         type: number
 *                         description: Count of assessments created by the teacher on that date
 *                   description: Total number of assessments created by the teacher, grouped by date
 *                 totalNoOfExperienceConducted:
 *                   type: number
 *                   description: Total number of experiences conducted
 *                 totalNoOfExperience:
 *                   type: array
 *                   description: Total number of experiences
 *                 totalNoOfAssessment:
 *                   type: number
 *                   description: Total number of assessments
 *       "500":
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Internal server error message
 */
router.get('/super_admin', auth('commonPermission'), dashboardController.getSuperAdminDashboardData);

module.exports = router;
