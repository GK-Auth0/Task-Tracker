import express from "express";
import { checkSchema } from "express-validator";
import {
  getProjects,
  createNewProject,
  getProject,
} from "../controllers/project";
import { createProjectSchema } from "../validators/project";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getProjects);
router.post(
  "/",
  authenticateToken,
  checkSchema(createProjectSchema),
  createNewProject,
);
router.get("/:id", authenticateToken, getProject);

export default router;
