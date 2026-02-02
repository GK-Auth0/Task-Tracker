import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { getEntityAuditLogs } from '../controllers/auditLog';
import { authenticateToken } from '../middleware/auth';
import { validateProject, validateProjectUpdate } from '../middleware/projectValidation';
import { upload } from '../middleware/upload';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - ownerId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the project
 *         name:
 *           type: string
 *           description: The project name
 *         description:
 *           type: string
 *           description: The project description
 *         status:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *           description: The project status
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: The project priority
 *         startDate:
 *           type: string
 *           format: date
 *           description: The project start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: The project end date
 *         ownerId:
 *           type: integer
 *           description: The project owner user id
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The project creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The project last update timestamp
 *     CreateProject:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The project name
 *         description:
 *           type: string
 *           description: The project description
 *         status:
 *           type: string
 *           enum: [planning, active, on_hold]
 *           description: The project status
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: The project priority
 *         startDate:
 *           type: string
 *           format: date
 *           description: The project start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: The project end date
 *         memberIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of user IDs to add as project members
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *         description: Filter by project status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in project name and description
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by project priority
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', projectController.getProjects);

/**
 * @swagger
 * /api/projects/users:
 *   get:
 *     summary: Get users for team member selection
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', projectController.getUsers);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 */
router.get('/:id', projectController.getProject);
router.get('/:id/activity', (req, res) => {
  req.query.entity_type = 'project';
  return getEntityAuditLogs(req, res);
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProject'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 */
router.post('/', validateProject, projectController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProject'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', validateProjectUpdate, projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTasks:
 *                       type: integer
 *                     todoTasks:
 *                       type: integer
 *                     inProgressTasks:
 *                       type: integer
 *                     completedTasks:
 *                       type: integer
 *                     progress:
 *                       type: integer
 */
/**
 * @swagger
 * /api/projects/{id}/roadmap:
 *   get:
 *     summary: Get project roadmap data
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project roadmap retrieved successfully
 */
router.get('/:id/roadmap', projectController.getProjectRoadmap);

/**
 * @swagger
 * /api/projects/{id}/files:
 *   get:
 *     summary: Get project files
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project files retrieved successfully
 */
router.get('/:id/files', projectController.getProjectFiles);

/**
 * @swagger
 * /api/projects/{id}/files/upload:
 *   post:
 *     summary: Upload file to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/:id/files/upload', upload.single('file'), projectController.uploadProjectFile);

router.get('/:id/stats', projectController.getProjectStats);

export default router;