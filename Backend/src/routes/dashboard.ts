import express from "express";
import { getInsights, getOverview, getSummary } from "../controllers/dashboard";
import { authenticateToken } from "../middleware/auth";
import { cacheGetResponse } from "../middleware/responseCache";
import { dashboardRateLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.get("/summary", authenticateToken, dashboardRateLimiter, cacheGetResponse(10000), getSummary);
router.get("/overview", authenticateToken, dashboardRateLimiter, cacheGetResponse(8000), getOverview);
router.get("/insights", authenticateToken, dashboardRateLimiter, cacheGetResponse(12000), getInsights);

export default router;
