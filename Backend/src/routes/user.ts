import express from "express";
import { getUsers, getUser } from "../controllers/user";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, getUsers);
router.get("/:id", authenticateToken, getUser);

export default router;