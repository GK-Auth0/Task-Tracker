import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import { createTestCaseModule, listTestCaseModules } from "../controllers/testCaseModule";

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

router.get("/", authenticateToken, listTestCaseModules);
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("project_id").isUUID(),
  handleValidationErrors,
  createTestCaseModule,
);

export default router;
