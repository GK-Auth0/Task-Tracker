import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "../config";

const JWT_SECRET = appConfig.jwt.accessSecret;

const readCookie = (req: Request, name: string) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return "";

  const cookieValue = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookieValue ? decodeURIComponent(cookieValue.slice(name.length + 1)) : "";
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.split(" ")[1];
  const cookieToken = readCookie(req, appConfig.jwt.accessCookieName);
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
      error: "UNAUTHORIZED",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.token_type && decoded.token_type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        error: "UNAUTHORIZED",
      });
    }
    (req as any).user = decoded;
    next();
  } catch (error) {
    const isExpired = error instanceof jwt.TokenExpiredError;

    return res.status(401).json({
      success: false,
      message: isExpired ? "Access token expired" : "Invalid access token",
      error: isExpired ? "TOKEN_EXPIRED" : "UNAUTHORIZED",
    });
  }
};
