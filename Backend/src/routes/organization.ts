import express from "express";
import { checkSchema } from "express-validator";
import { createOrg, joinOrgByCode } from "../controllers/organization";
import { authenticateToken } from "../middleware/auth";
import {
  createOrganizationSchema,
  joinOrganizationByCodeSchema,
} from "../validators/organization";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  checkSchema(createOrganizationSchema),
  createOrg,
);

router.post(
  "/join-by-code",
  authenticateToken,
  checkSchema(joinOrganizationByCodeSchema),
  joinOrgByCode,
);

export default router;
