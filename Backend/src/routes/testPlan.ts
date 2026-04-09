import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import { createTestPlanRecord, listTestPlans } from "../controllers/testPlan";

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

router.get("/", authenticateToken, listTestPlans);
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("name").trim().isLength({ min: 3, max: 255 }),
  body("project_id").isUUID(),
  body("status").optional().isIn(["Draft", "Active", "Completed"]),
  body("suite_names").optional().isArray(),
  handleValidationErrors,
  createTestPlanRecord,
);

export default router;
