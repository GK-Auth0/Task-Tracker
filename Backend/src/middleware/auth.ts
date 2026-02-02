import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { syncAuth0User } from "../services/auth0Sync";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
      error: "UNAUTHORIZED",
    });
  }

  try {
    // Try Auth0 token first
    const decoded = jwt.decode(token) as any;
    
    if (decoded?.iss?.includes('auth0.com')) {
      const user = await syncAuth0User(decoded);
      (req as any).user = { id: user.id, email: user.email, role: user.role };
      return next();
    }
    
    // Fallback to custom JWT
    const customDecoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = customDecoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid token",
      error: "UNAUTHORIZED",
    });
  }
};
