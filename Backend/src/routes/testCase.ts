import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import {
  createTestCaseRecord,
  getTestCaseFormOptions,
  listTestCases,
} from "../controllers/testCase";

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

router.get("/", authenticateToken, listTestCases);
router.get("/form-options", authenticateToken, getTestCaseFormOptions);

router.post(
  "/",
  authenticateToken,
  requireWorkspaceRole("Member"),
  body("title").trim().isLength({ min: 3, max: 255 }),
  body("project_id").isUUID(),
  body("linked_task_id").optional({ values: "falsy" }).isUUID(),
  body("suite").trim().isLength({ min: 2, max: 120 }),
  body("module").trim().isLength({ min: 2, max: 120 }),
  body("priority").isIn(["Critical", "High", "Medium", "Low"]),
  body("status").optional().isIn(["Draft", "Ready", "Blocked", "Passed", "Failed"]),
  body("automation").isIn(["Manual", "Automated", "Candidate"]),
  handleValidationErrors,
  createTestCaseRecord,
);

export default router;
