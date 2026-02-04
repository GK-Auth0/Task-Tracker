import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "dev-diqujin7clfrgz2o.us.auth0.com";

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
    // First try to verify as custom JWT
    try {
      const customDecoded = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = customDecoded;
      return next();
    } catch (jwtError) {
      // If custom JWT fails, try Auth0 token
      console.log('Custom JWT verification failed, trying Auth0...');
    }

    // Try Auth0 token verification
    try {
      const response = await axios.get(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const auth0User = response.data;
      console.log('Auth0 user verified:', auth0User.email);
      
      // Find or create user from Auth0 data
      let user = await User.findOne({ where: { email: auth0User.email } });
      if (!user) {
        console.log('Creating new user from Auth0 data');
        user = await User.create({
          email: auth0User.email,
          password_hash: '',
          full_name: auth0User.name || auth0User.email.split('@')[0],
          role: "Member",
        });
      }
      
      (req as any).user = { id: user.id, email: user.email, role: user.role };
      return next();
    } catch (auth0Error: any) {
      console.error('Auth0 token verification failed:', auth0Error.response?.data || auth0Error.message);
    }

    // If both fail, return unauthorized
    return res.status(403).json({
      success: false,
      message: "Invalid token",
      error: "UNAUTHORIZED",
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      message: "Token verification failed",
      error: "UNAUTHORIZED",
    });
  }
};
