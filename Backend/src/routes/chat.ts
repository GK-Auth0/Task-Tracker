import express from "express";
import {
  chatReadRateLimiter,
  chatWriteRateLimiter,
  searchRateLimiter,
} from "../middleware/rateLimit";
import {
  getGroups,
  createGroup,
  getMessages,
  sendMessage,
  searchUsers,
  createOrOpenDirect,
  uploadAttachment,
} from "../controllers/chat";
import { authenticateToken } from "../middleware/auth";
import { cacheGetResponse } from "../middleware/responseCache";
import { chatReadThrottle, chatWriteThrottle, searchThrottle } from "../middleware/throttle";
import { upload } from "../middleware/upload";

const router = express.Router();

router.get("/groups", authenticateToken, chatReadThrottle, chatReadRateLimiter, cacheGetResponse(5000), getGroups);
router.post("/groups", authenticateToken, chatWriteThrottle, chatWriteRateLimiter, createGroup);
router.get("/users/search", authenticateToken, searchThrottle, searchRateLimiter, cacheGetResponse(5000), searchUsers);
router.post("/direct/:userId", authenticateToken, createOrOpenDirect);
router.get(
  "/groups/:groupId/messages",
  authenticateToken,
  chatReadThrottle,
  chatReadRateLimiter,
  cacheGetResponse(3000),
  getMessages,
);
router.post("/groups/:groupId/messages", authenticateToken, chatWriteThrottle, chatWriteRateLimiter, sendMessage);
router.post(
  "/groups/:groupId/attachments",
  authenticateToken,
  chatWriteThrottle,
  chatWriteRateLimiter,
  upload.single("file"),
  uploadAttachment,
);

export default router;
