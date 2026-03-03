import express from "express";
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
import { upload } from "../middleware/upload";

const router = express.Router();

router.get("/groups", authenticateToken, getGroups);
router.post("/groups", authenticateToken, createGroup);
router.get("/users/search", authenticateToken, searchUsers);
router.post("/direct/:userId", authenticateToken, createOrOpenDirect);
router.get("/groups/:groupId/messages", authenticateToken, getMessages);
router.post("/groups/:groupId/messages", authenticateToken, sendMessage);
router.post(
  "/groups/:groupId/attachments",
  authenticateToken,
  upload.single("file"),
  uploadAttachment,
);

export default router;
