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
import { upload } from "../middleware/upload";

const router = express.Router();

router.get("/groups", authenticateToken, chatReadRateLimiter, cacheGetResponse(5000), getGroups);
router.post("/groups", authenticateToken, chatWriteRateLimiter, createGroup);
router.get("/users/search", authenticateToken, searchRateLimiter, cacheGetResponse(5000), searchUsers);
router.post("/direct/:userId", authenticateToken, createOrOpenDirect);
router.get(
  "/groups/:groupId/messages",
  authenticateToken,
  chatReadRateLimiter,
  cacheGetResponse(3000),
  getMessages,
);
router.post("/groups/:groupId/messages", authenticateToken, chatWriteRateLimiter, sendMessage);
router.post(
  "/groups/:groupId/attachments",
  authenticateToken,
  chatWriteRateLimiter,
  upload.single("file"),
  uploadAttachment,
);

export default router;
