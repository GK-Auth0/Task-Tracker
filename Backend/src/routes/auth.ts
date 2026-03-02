import express from "express";
import { checkSchema } from "express-validator";
import {
  register,
  login,
  me,
  auth0Login,
  verifyOtp,
  resendOtpCode,
  forgotPassword,
  resetPassword,
} from "../controllers/auth";
import {
  registerSchema,
  loginSchema,
  auth0LoginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/register", checkSchema(registerSchema), register);
router.post("/login", checkSchema(loginSchema), login);
router.post("/auth0", checkSchema(auth0LoginSchema), auth0Login);
router.post("/verify-otp", checkSchema(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", checkSchema(resendOtpSchema), resendOtpCode);
router.post("/forgot-password", checkSchema(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", checkSchema(resetPasswordSchema), resetPassword);
router.get("/me", authenticateToken, me);

export default router;
