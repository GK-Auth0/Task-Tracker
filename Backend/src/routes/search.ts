import express from "express";
import { authenticateToken } from "../middleware/auth";
import { globalSearch } from "../controllers/search";
import { cacheGetResponse } from "../middleware/responseCache";
import { searchRateLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.get("/global", authenticateToken, searchRateLimiter, cacheGetResponse(5000), globalSearch);

export default router;
