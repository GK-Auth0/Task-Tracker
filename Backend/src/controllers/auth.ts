import { Request, Response } from "express";
import { handleValidationErrors } from "../utils/validation";
import { registerUser, loginUser, getCurrentUser } from "../services/auth";

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
      message: "Registration successful",
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
