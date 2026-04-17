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
  user,
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
  updateSchema,
} from "../validators/auth";
import { authenticateToken } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";
import { authThrottle } from "../middleware/throttle";

const router = express.Router();

router.post("/register", authThrottle, authRateLimiter, checkSchema(registerSchema), register);
router.post("/login", authThrottle, authRateLimiter, checkSchema(loginSchema), login);
router.post("/auth0", authThrottle, authRateLimiter, checkSchema(auth0LoginSchema), auth0Login);
router.post("/verify-otp", authThrottle, authRateLimiter, checkSchema(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", authThrottle, authRateLimiter, checkSchema(resendOtpSchema), resendOtpCode);
router.post("/forgot-password", authThrottle, authRateLimiter, checkSchema(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authThrottle, authRateLimiter, checkSchema(resetPasswordSchema), resetPassword);
router.post("/change-password-invited", authThrottle, authRateLimiter, checkSchema(changePasswordInvitedSchema), changePasswordInvited);
router.post("/refresh", authThrottle, authRateLimiter, refreshSession);
router.post("/logout", logout);
router.get("/me", authenticateToken, me);
router.patch("/user", authenticateToken, authThrottle, authRateLimiter, checkSchema(updateSchema), user)

export default router;
