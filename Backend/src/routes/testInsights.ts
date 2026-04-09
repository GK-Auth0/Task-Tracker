import express from "express";
import { authenticateToken } from "../middleware/auth";
import { getTestReportsSummary, getTraceabilityMatrix } from "../controllers/testInsights";

const router = express.Router();

router.get("/traceability", authenticateToken, getTraceabilityMatrix);
router.get("/reports", authenticateToken, getTestReportsSummary);

export default router;
