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
} from "../controllers/task";
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
router.get("/:id/pull-requests", authenticateToken, getTaskPRs);
router.get("/:id/commits", authenticateToken, getTaskCommitHistory);
router.patch(
  "/:id",
  authenticateToken,
  checkSchema(updateTaskSchema),
  updateTaskDetails,
);
router.delete("/:id", authenticateToken, removeTask);

export default router;
