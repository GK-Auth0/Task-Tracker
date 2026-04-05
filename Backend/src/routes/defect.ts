import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import {
  createDefectRecord,
  listDefects,
  reviewDefectRecord,
  updateDefectRecord,
} from "../controllers/defect";

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

router.get("/", authenticateToken, listDefects);

router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("title").trim().isLength({ min: 2, max: 255 }),
  body("description").trim().isLength({ min: 10, max: 4000 }),
  body("project_id").isUUID(),
  body("assignee_id").optional({ values: "falsy" }).isUUID(),
  body("linked_task_id").optional({ values: "falsy" }).isUUID(),
  body("severity").isIn(["Critical", "High", "Medium", "Low"]),
  body("priority").isIn(["Critical", "High", "Medium", "Low"]),
  handleValidationErrors,
  createDefectRecord,
);

router.patch(
  "/:id",
  authenticateToken,
  requireWorkspaceRole("Member"),
  updateDefectRecord,
);

router.patch(
  "/:id/review",
  authenticateToken,
  requireWorkspaceRole("Member"),
  reviewDefectRecord,
);

export default router;
