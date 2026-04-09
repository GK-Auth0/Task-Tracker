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
  changePasswordInvited,
  refreshSession,
  logout,
} from "../controllers/auth";
import {
  registerSchema,
  loginSchema,
  auth0LoginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordInvitedSchema,
} from "../validators/auth";
import { authenticateToken } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.post("/register", authRateLimiter, checkSchema(registerSchema), register);
router.post("/login", authRateLimiter, checkSchema(loginSchema), login);
router.post("/auth0", authRateLimiter, checkSchema(auth0LoginSchema), auth0Login);
router.post("/verify-otp", authRateLimiter, checkSchema(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", authRateLimiter, checkSchema(resendOtpSchema), resendOtpCode);
router.post("/forgot-password", authRateLimiter, checkSchema(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authRateLimiter, checkSchema(resetPasswordSchema), resetPassword);
router.post("/change-password-invited", authRateLimiter, checkSchema(changePasswordInvitedSchema), changePasswordInvited);
router.post("/refresh", authRateLimiter, refreshSession);
router.post("/logout", logout);
router.get("/me", authenticateToken, me);

export default router;
