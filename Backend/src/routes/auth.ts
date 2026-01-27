import express from "express";
import { checkSchema } from "express-validator";
import { register, login, me } from "../controllers/auth";
import { registerSchema, loginSchema } from "../validators/auth";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/register", checkSchema(registerSchema), register);
router.post("/login", checkSchema(loginSchema), login);
router.get("/me", authenticateToken, me);

export default router;