import express from "express";
import { getGroups, createGroup, getMessages, sendMessage } from "../controllers/chat";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/groups", authenticateToken, getGroups);
router.post("/groups", authenticateToken, createGroup);
router.get("/groups/:groupId/messages", authenticateToken, getMessages);
router.post("/groups/:groupId/messages", authenticateToken, sendMessage);

export default router;