import { Request, Response, NextFunction } from "express";

/**
 * Production-grade cache control middleware for APIs
 * Ensures API responses are never cached by browsers, proxies, or CDNs
 */
export const disableCache = (req: Request, res: Response, next: NextFunction): void => {
  // HTTP/1.1 cache control
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, private, max-age=0");
  
  // HTTP/1.0 compatibility
  res.setHeader("Pragma", "no-cache");
  
  // Proxy cache control
  res.setHeader("Expires", "0");
  
  // CDN cache control (Cloudflare, AWS CloudFront, etc.)
  res.setHeader("Surrogate-Control", "no-store");
  
  // Additional security headers for API responses
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent caching of sensitive API responses
  res.setHeader("Vary", "Authorization, Accept-Encoding");
  
  next();
};

/**
 * Selective cache control - disable cache only for sensitive endpoints
 */
export const disableCacheForSensitive = (req: Request, res: Response, next: NextFunction): void => {
  const sensitivePatterns = [
    /^\/api\/auth/,
    /^\/api\/users/,
    /^\/api\/admin/,
    /^\/api\/.*\/activity$/,
    /^\/api\/.*\/audit$/
  ];

  const isSensitive = sensitivePatterns.some(pattern => pattern.test(req.path));

  if (isSensitive) {
    disableCache(req, res, next);
  } else {
    // Allow short-term caching for non-sensitive API data
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300"); // 5 minutes
    next();
  }
};

/**
 * Development cache control - always disable cache in development
 */
export const developmentCacheControl = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === "development") {
    disableCache(req, res, next);
  } else {
    next();
  }
};