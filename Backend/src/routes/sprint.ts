import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import { createSprintRecord, listSprints } from "../controllers/sprint";

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
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("project_id").isUUID(),
  body("owner_id").optional({ values: "falsy" }).isUUID(),
  body("task_ids").optional().isArray(),
  body("status").optional().isIn(["Planning", "Active", "Completed"]),
  handleValidationErrors,
  createSprintRecord,
);

export default router;
