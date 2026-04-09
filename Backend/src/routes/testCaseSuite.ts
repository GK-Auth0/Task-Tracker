import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import { createTestCaseSuite, listTestCaseSuites } from "../controllers/testCaseSuite";

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

router.get("/", authenticateToken, listTestCaseSuites);
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("project_id").isUUID(),
  handleValidationErrors,
  createTestCaseSuite,
);

export default router;
