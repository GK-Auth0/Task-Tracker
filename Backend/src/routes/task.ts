import express from "express";
import { checkSchema } from "express-validator";
import {
  getTasks,
  createNewTask,
  getTask,
  updateTaskDetails,
  removeTask,
  getTaskPRs,
  createTaskPR,
  getTaskCommitHistory,
} from "../controllers/task";
import { getEntityAuditLogs } from "../controllers/auditLog";
import { createTaskSchema, updateTaskSchema } from "../validators/task";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getTasks);
router.post(
  "/",
  authenticateToken,
  checkSchema(createTaskSchema),
  createNewTask,
);
router.get("/:id", authenticateToken, getTask);
router.get("/:id/activity", authenticateToken, getEntityAuditLogs);
router.get("/:id/pull-requests", authenticateToken, getTaskPRs);
router.post("/:id/pull-requests", authenticateToken, createTaskPR);
router.get("/:id/pull-requests/:prId/visit", authenticateToken, visitPRLink);
router.get("/:id/commits", authenticateToken, getTaskCommitHistory);
router.patch(
  "/:id",
  authenticateToken,
  checkSchema(updateTaskSchema),
  updateTaskDetails,
);
router.delete("/:id", authenticateToken, removeTask);

export default router;
