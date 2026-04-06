import { CookieOptions, Request, Response } from "express";
import { handleValidationErrors } from "../helpers/validation";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  loginWithAuth0AccessToken,
  verifyOtpAndIssueToken,
  resendOtp,
  requestPasswordReset,
  resetPasswordWithOtp,
  changePasswordForInvitedUser,
  createRefreshSession,
  refreshAuthSession,
  revokeRefreshSession,
} from "../services/auth";
import sequelize from "../config/database";
import { appConfig } from "../config/app";

const getOtpEmailErrorHint = (error: any): string | null => {
  const message = String(error?.message || "");
  if (message.includes("RESEND_API_KEY")) {
    return "Resend requires a valid API key and a verified sender domain. If you don't have a domain, set EMAIL_PROVIDER=smtp and configure EMAIL_USER/EMAIL_PASS.";
  }
  if (message.includes("EMAIL_USER or EMAIL_PASS")) {
    return "SMTP credentials are missing. Set EMAIL_USER and EMAIL_PASS (e.g. a Gmail app password).";
  }
  if (message.includes("OTP_EMAIL_WEBHOOK_URL")) {
    return "Webhook email delivery is enabled but OTP_EMAIL_WEBHOOK_URL is not set.";
  }
  if (message.includes("Unsupported EMAIL_PROVIDER")) {
    return "EMAIL_PROVIDER must be one of smtp, resend, or webhook.";
  }
  return null;
};

const extractClientIp = (req: Request): string | undefined => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const raw =
    (typeof forwardedFor === "string" && forwardedFor.split(",")[0]?.trim()) ||
    (typeof realIp === "string" && realIp.trim()) ||
    req.ip ||
    req.connection?.remoteAddress ||
    undefined;

  if (!raw) return undefined;

  let ip = raw.trim();
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  } else if (ip.includes(":") && ip.includes(".") && ip.split(":").length === 2) {
    ip = ip.split(":")[0];
  }

  return ip;
};

const extractUserAgent = (req: Request) => {
  const userAgent = req.headers["user-agent"];
  return typeof userAgent === "string" ? userAgent : undefined;
};

const parseDurationToMs = (value: string, fallbackMs: number) => {
  const normalized = String(value || "").trim().toLowerCase();
  const match = normalized.match(/^(\d+)\s*(s|m|h|d)$/);

  if (!match) {
    const asNumber = Number.parseInt(normalized, 10);
    return Number.isFinite(asNumber) ? asNumber * 1000 : fallbackMs;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];

  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

const getRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: appConfig.isProduction,
  sameSite: appConfig.isProduction ? "none" : "lax",
  path: "/api/auth",
  maxAge: parseDurationToMs(appConfig.jwt.refreshExpiresIn, 30 * 24 * 60 * 60 * 1000),
});

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(appConfig.jwt.refreshCookieName, refreshToken, getRefreshCookieOptions());
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(appConfig.jwt.refreshCookieName, getRefreshCookieOptions());
};

const readCookie = (req: Request, name: string) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return "";

  const cookieValue = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookieValue ? decodeURIComponent(cookieValue.slice(name.length + 1)) : "";
};

const attachRefreshSession = async (req: Request, res: Response, userId: string) => {
  const refreshSession = await createRefreshSession(userId, {
    ip: extractClientIp(req),
    userAgent: extractUserAgent(req),
  });

  setRefreshCookie(res, refreshSession.token);
};

export const register = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;
  const transaction = await sequelize.transaction();

  try {
    const clientIP = extractClientIp(req);
    const userAgent = extractUserAgent(req);
    
    const userData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      ip: clientIP,
      userAgent,
    };

    const result = await registerUser(userData,transaction);
    await transaction.commit();
    return res.status(201).json({
      success: true,
      message: "Registration initiated. OTP verification required",
      data: result,
    });
  } catch (error) {
    await transaction.rollback();
    const otpHint = getOtpEmailErrorHint(error);
    return res.status(400).json({
      success: false,
      message: otpHint ? "Registration failed: OTP delivery error" : "Registration failed",
      error: otpHint ?? (error as any).message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const loginData = {
      email: req.body.email,
      password: req.body.password,
    };

    const result = await loginUser(loginData);
    if ((result as any)?.requiresOtp) {
      return res.status(200).json({
        success: true,
        message: "OTP verification required",
        data: result,
      });
    }

    if ((result as any)?.user?.id) {
      await attachRefreshSession(req, res, (result as any).user.id);
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Login failed",
      error: (error as any).message,
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const user = await getCurrentUser(userId);
    return res.status(200).json({
      success: true,
      message: "User profile retrieved",
      data: user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: (error as any).message,
    });
  }
};

export const auth0Login = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const result = await loginWithAuth0AccessToken(req.body.accessToken);
    await attachRefreshSession(req, res, result.user.id);
    return res.status(200).json({
      success: true,
      message: "Auth0 login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Auth0 login failed",
      error: (error as any).message,
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const result = await verifyOtpAndIssueToken(
      req.body.otpSessionId,
      req.body.otp,
    );
    await attachRefreshSession(req, res, result.user.id);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "OTP verification failed",
      error: (error as any).message,
    });
  }
};

export const resendOtpCode = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const result = await resendOtp(req.body.otpSessionId);
    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      data: result,
    });
  } catch (error) {
    const otpHint = getOtpEmailErrorHint(error);
    return res.status(400).json({
      success: false,
      message: otpHint ? "Failed to resend OTP: delivery error" : "Failed to resend OTP",
      error: otpHint ?? (error as any).message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const result = await requestPasswordReset(req.body.email);
    return res.status(200).json({
      success: true,
      message: "OTP sent to the provided email if it exists.",
      data: result,
    });
  } catch (error) {
    const otpHint = getOtpEmailErrorHint(error);
    return res.status(400).json({
      success: false,
      message: otpHint
        ? "Failed to process forgot password request: delivery error"
        : "Failed to process forgot password request",
      error: otpHint ?? (error as any).message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    await resetPasswordWithOtp(
      req.body.otpSessionId,
      req.body.otp,
      req.body.newPassword,
    );
    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to reset password",
      error: (error as any).message,
    });
  }
};

export const changePasswordInvited = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    await changePasswordForInvitedUser(
      req.body.email,
      req.body.newPassword,
    );
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to change password",
      error: (error as any).message,
    });
  }
};

export const refreshSession = async (req: Request, res: Response) => {
  try {
    const refreshToken = readCookie(req, appConfig.jwt.refreshCookieName);

    if (!refreshToken) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
        error: "UNAUTHORIZED",
      });
    }

    const result = await refreshAuthSession(refreshToken, {
      ip: extractClientIp(req),
      userAgent: extractUserAgent(req),
    });

    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Session refreshed",
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({
      success: false,
      message: "Failed to refresh session",
      error: (error as any).message,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = readCookie(req, appConfig.jwt.refreshCookieName);

  if (refreshToken) {
    await revokeRefreshSession(refreshToken);
  }

  clearRefreshCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};


export const invite=async(req:Request,res:Response)=>{
   if (handleValidationErrors(req, res)) return;
   const transaction=await sequelize.transaction()
   try{
 const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
    const userAgent = extractUserAgent(req);
    
    const userData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      ip: clientIP,
      userAgent,
    };

    const result = await registerUser(userData,transaction);
    await transaction.commit();
    return res.status(201).json({
      success: true,
      message: "Registration initiated. OTP verification required",
      data: result,
    });

   }catch(error){

   }
}
