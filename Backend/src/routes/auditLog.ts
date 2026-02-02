import express from "express";
import { getEntityAuditLogs } from "../controllers/auditLog";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getEntityAuditLogs);

export default router;