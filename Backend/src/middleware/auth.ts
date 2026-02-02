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
    // Decode token to check issuer
    const decoded = jwt.decode(token, { complete: true }) as any;
    
    if (decoded?.payload?.iss?.includes('auth0.com')) {
      // Handle Auth0 token - verify with Auth0 userinfo endpoint
      try {
        const response = await axios.get(`https://${AUTH0_DOMAIN}/userinfo`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const auth0User = response.data;
        
        // Find or create user from Auth0 data
        let user = await User.findOne({ where: { email: auth0User.email } });
        if (!user) {
          user = await User.create({
            email: auth0User.email,
            password_hash: '',
            full_name: auth0User.name || auth0User.email.split('@')[0],
            role: "Member",
          });
        }
        
        (req as any).user = { id: user.id, email: user.email, role: user.role };
        next();
      } catch (auth0Error) {
        console.error('Auth0 token verification error:', auth0Error.response?.data || auth0Error.message);
        return res.status(403).json({
          success: false,
          message: "Invalid Auth0 token",
          error: "UNAUTHORIZED",
        });
      }
    } else {
      // Handle custom JWT
      const customDecoded = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = customDecoded;
      next();
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid token",
      error: "UNAUTHORIZED",
    });
  }
};
