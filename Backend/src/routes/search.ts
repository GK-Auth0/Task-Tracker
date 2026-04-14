import express from "express";
import { authenticateToken } from "../middleware/auth";
import { globalSearch } from "../controllers/search";
import { cacheGetResponse } from "../middleware/responseCache";
import { searchRateLimiter } from "../middleware/rateLimit";
import { searchThrottle } from "../middleware/throttle";

const router = express.Router();

router.get("/global", authenticateToken, searchThrottle, searchRateLimiter, cacheGetResponse(5000), globalSearch);

export default router;
