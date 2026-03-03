import { appConfig } from "../config";

const isOriginAllowed = (origin: string) => {
  if (appConfig.cors.allowedOrigins.includes("*")) return true;
  return appConfig.cors.allowedOrigins.includes(origin);
};

export const corsOptionsDelegate = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
    
    // Check if origin is in allowed list
    if (appConfig.cors.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any vercel.app domain in production
    if (appConfig.env === 'production' && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    console.log('Allowed origins:', appConfig.cors.allowedOrigins);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
