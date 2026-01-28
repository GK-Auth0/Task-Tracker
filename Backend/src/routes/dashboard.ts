import express from "express";
import { getSummary } from "../controllers/dashboard";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/summary", authenticateToken, getSummary);

export default router;
