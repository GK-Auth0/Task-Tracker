import express from "express";
import { checkSchema } from "express-validator";
import {
  getTasks,
  createNewTask,
  getTask,
  updateTaskDetails,
  removeTask,
  getTaskPRs,
  getTaskCommitHistory,
  getTaskActivityLogs,
} from "../controllers/task";
import { createTaskSchema, updateTaskSchema } from "../validators/task";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";

const router = express.Router();

// Payload logging middleware
const logPayload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('=== TASK ROUTE PAYLOAD ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? '[PRESENT]' : '[MISSING]',
    'user-agent': req.headers['user-agent']
  });
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('User:', (req as any).user ? JSON.stringify((req as any).user, null, 2) : 'Not authenticated yet');
  console.log('========================');
  next();
};

router.get("/", authenticateToken, getTasks);
router.post(
  "/",
  logPayload, // Log before authentication
  authenticateToken,
  requireWorkspaceRole("Member"),
  checkSchema(createTaskSchema),
  createNewTask,
);
router.get("/:id", authenticateToken, getTask);
router.get("/:id/activity", authenticateToken, getTaskActivityLogs);
router.get("/:id/pull-requests", authenticateToken, getTaskPRs);
router.get("/:id/commits", authenticateToken, getTaskCommitHistory);
router.patch(
  "/:id",
  authenticateToken,
  requireWorkspaceRole("Member"),
  checkSchema(updateTaskSchema),
  updateTaskDetails,
);
router.delete("/:id", authenticateToken, requireWorkspaceRole("Member"), removeTask);

export default router;
