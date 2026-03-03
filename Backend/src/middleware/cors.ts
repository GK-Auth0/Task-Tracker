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
  },
  credentials: true,
};
