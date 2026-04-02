import { appConfig } from "../config";

const getOriginHost = (value: string) => {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const getOriginFromEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (!value) continue;

    try {
      return new URL(value).origin;
    } catch {
      continue;
    }
  }

  return null;
};

const publicBackendOrigin = getOriginFromEnv(
  "BACKEND_PUBLIC_URL",
  "API_BASE_URL",
  "RENDER_EXTERNAL_URL",
  "PUBLIC_URL",
);

const isOriginAllowed = (origin: string) => {
  if (appConfig.cors.allowedOrigins.includes("*")) return true;
  return appConfig.cors.allowedOrigins.includes(origin);
};

const isTrustedProductionOrigin = (origin: string) => {
  if (appConfig.env !== "production") return false;

  if (publicBackendOrigin && origin === publicBackendOrigin) {
    return true;
  }

  const host = getOriginHost(origin);
  if (!host) return false;

  return host.endsWith(".vercel.app") || host.endsWith(".onrender.com");
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

    // Optional convenience for production preview and hosted docs deployments.
    if (isTrustedProductionOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
