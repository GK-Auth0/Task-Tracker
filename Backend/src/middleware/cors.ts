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
    // Allow non-browser/same-origin requests without Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    // Optional convenience for preview deployments.
    if (appConfig.env === "production" && origin.includes(".vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
