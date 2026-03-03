import express from "express";
import { authenticateToken } from "../middleware/auth";
import { chatWithAssistant } from "../controllers/ai";

const router = express.Router();

router.post("/chat", authenticateToken, chatWithAssistant);

export default router;
