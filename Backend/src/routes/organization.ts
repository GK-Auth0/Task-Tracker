import express from "express";
import { checkSchema } from "express-validator";
import { createOrg } from "../controllers/organization";
import { authenticateToken } from "../middleware/auth";
import { createOrganizationSchema } from "../validators/organization";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  checkSchema(createOrganizationSchema),
  createOrg,
);

export default router;
