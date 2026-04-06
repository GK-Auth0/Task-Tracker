import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import { createTestRunRecord, listTestRuns } from "../controllers/testRun";

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

router.get("/", authenticateToken, listTestRuns);
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("name").trim().isLength({ min: 3, max: 255 }),
  body("plan_id").isUUID(),
  body("environment").trim().isLength({ min: 2, max: 120 }),
  body("status").optional().isIn(["Planned", "In Progress", "Completed", "Blocked"]),
  handleValidationErrors,
  createTestRunRecord,
);

export default router;
