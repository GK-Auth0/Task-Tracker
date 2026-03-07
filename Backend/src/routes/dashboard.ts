import express from "express";
import { getInsights, getOverview, getSummary } from "../controllers/dashboard";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/summary", authenticateToken, getSummary);
router.get("/overview", authenticateToken, getOverview);
router.get("/insights", authenticateToken, getInsights);

export default router;
