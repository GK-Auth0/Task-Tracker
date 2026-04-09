import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import {
  addTasksToSprintRecord,
  completeSprintRecord,
  createSprintRecord,
  getSprintRecord,
  getSprintInsightsRecord,
  listSprints,
  removeTaskFromSprintRecord,
  startSprintRecord,
  updateSprintRecord,
} from "../controllers/sprint";

const router = express.Router();

const handleValidationErrors: express.RequestHandler = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.array(),
    });
  }
  return next();
};

router.get("/", authenticateToken, listSprints);
router.get("/:id/insights", authenticateToken, getSprintInsightsRecord);
router.get("/:id", authenticateToken, getSprintRecord);
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("name").optional({ values: "falsy" }).trim().isLength({ min: 2, max: 120 }),
  body("project_id").isUUID(),
  body("owner_id").optional({ values: "falsy" }).isUUID(),
  body("task_ids").optional().isArray(),
  body("status").optional().isIn(["Planning", "Active", "Completed"]),
  handleValidationErrors,
  createSprintRecord,
);
router.patch("/:id", authenticateToken, requireWorkspaceRole("Member"), updateSprintRecord);
router.post("/:id/start", authenticateToken, requireWorkspaceRole("Member"), startSprintRecord);
router.post("/:id/complete", authenticateToken, requireWorkspaceRole("Member"), completeSprintRecord);
router.post("/:id/tasks", authenticateToken, requireWorkspaceRole("Member"), addTasksToSprintRecord);
router.delete("/:id/tasks/:taskId", authenticateToken, requireWorkspaceRole("Member"), removeTaskFromSprintRecord);

export default router;
