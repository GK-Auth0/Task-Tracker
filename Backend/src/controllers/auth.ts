import { Request, Response } from "express";
import { handleValidationErrors } from "../helpers/validation";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  loginWithAuth0AccessToken,
  verifyOtpAndIssueToken,
  resendOtp,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../services/auth";

export const register = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];
    
    const userData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      ip: clientIP,
      userAgent,
    };

    const result = await registerUser(userData);
    return res.status(201).json({
      success: true,
      message: "Registration initiated. OTP verification required",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Registration failed",
      error: (error as any).message,
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
    return res.status(400).json({
      success: false,
      message: "Failed to get user profile",
      error: (error as any).message,
    });
  }
};

export const auth0Login = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const result = await loginWithAuth0AccessToken(req.body.accessToken);
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
    return res.status(400).json({
      success: false,
      message: "Failed to resend OTP",
      error: (error as any).message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    await requestPasswordReset(req.body.email);
    return res.status(200).json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to process forgot password request",
      error: (error as any).message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    await resetPasswordWithToken(req.body.token, req.body.newPassword);
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
