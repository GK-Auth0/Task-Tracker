import express from "express";
import { authenticateToken } from "../middleware/auth";
import { chatWithAssistant } from "../controllers/ai";
import { aiRateLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.post("/chat", aiRateLimiter, authenticateToken, chatWithAssistant);

export default router;
