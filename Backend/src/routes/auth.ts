import express from "express";
import { checkSchema } from "express-validator";
import { register, login, me, syncAuth0 } from "../controllers/auth";
import { registerSchema, loginSchema } from "../validators/auth";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/register", checkSchema(registerSchema), register);
router.post("/login", checkSchema(loginSchema), login);
router.post("/sync-auth0", syncAuth0);
router.post("/auth0-login", syncAuth0); // Alias for Auth0 login
router.get("/me", authenticateToken, me);

export default router;
