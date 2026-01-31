import express from "express";
import { getUsers, getUser } from "../controllers/user";
import { getUserMetadata } from "../controllers/userMetadata";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getUsers);
router.get("/metadata", authenticateToken, getUserMetadata);
router.get("/:id", authenticateToken, getUser);

export default router;
