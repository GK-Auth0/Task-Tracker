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

router.get("/", authenticateToken, getTasks);
router.post(
  "/",
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
