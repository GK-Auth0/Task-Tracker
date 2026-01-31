import { appConfig } from "../config";

export const corsOptionsDelegate = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
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
