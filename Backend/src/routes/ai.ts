import express from "express";
import { authenticateToken } from "../middleware/auth";
import { chatWithAssistant } from "../controllers/ai";
import { aiRateLimiter } from "../middleware/rateLimit";
import { aiThrottle } from "../middleware/throttle";

const router = express.Router();

router.post("/chat", aiThrottle, aiRateLimiter, authenticateToken, chatWithAssistant);

export default router;
