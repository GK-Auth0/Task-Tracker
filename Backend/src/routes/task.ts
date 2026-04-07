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
  createTaskSubtask,
  updateTaskSubtask,
  removeTaskSubtask,
} from "../controllers/task";
import {
  createSubtaskSchema,
  createTaskSchema,
  updateSubtaskSchema,
  updateTaskSchema,
} from "../validators/task";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";

const router = express.Router();

router.get("/", authenticateToken, getTasks);
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  checkSchema(createTaskSchema, ["body"]),
  createNewTask,
);
router.get("/:id", authenticateToken, getTask);
router.get("/:id/activity", authenticateToken, getTaskActivityLogs);
router.get("/:id/pull-requests", authenticateToken, getTaskPRs);
router.get("/:id/commits", authenticateToken, getTaskCommitHistory);
router.post(
  "/:id/subtasks",
  authenticateToken,
  requireWorkspaceRole("Member"),
  checkSchema(createSubtaskSchema, ["body"]),
  createTaskSubtask,
);
router.patch(
  "/:id/subtasks/:subtaskId",
  authenticateToken,
  requireWorkspaceRole("Member"),
  checkSchema(updateSubtaskSchema, ["body"]),
  updateTaskSubtask,
);
router.delete(
  "/:id/subtasks/:subtaskId",
  authenticateToken,
  requireWorkspaceRole("Member"),
  removeTaskSubtask,
);
router.patch(
  "/:id",
  authenticateToken,
  requireWorkspaceRole("Member"),
  checkSchema(updateTaskSchema, ["body"]),
  updateTaskDetails,
);
router.delete("/:id", authenticateToken, requireWorkspaceRole("Member"), removeTask);

export default router;
