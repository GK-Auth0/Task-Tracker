import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../config/env/.env") });

const getEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return fallback;
};

const env = getEnv("NODE_ENV") || "development";
const configuredOrigins = (getEnv("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

export const appConfig = {
  env,
  isProduction: env === "production",
  port: parseNumber(getEnv("PORT"), 3000),
  database: {
    host:
      (getEnv("DATABASE_HOST", "DB_HOST") || "localhost") === "localhost"
        ? "127.0.0.1"
        : (getEnv("DATABASE_HOST", "DB_HOST") as string),
    port: parseNumber(getEnv("DATABASE_PORT", "DB_PORT"), 5432),
    name: getEnv("DATABASE_NAME", "DB_NAME") || "task_tracker",
    user: getEnv("DATABASE_USER", "DB_USER") || "postgres",
    password: getEnv("DATABASE_PASSWORD", "DB_PASSWORD") || "password",
    url: getEnv("DATABASE_URL"),
    ssl: parseBoolean(getEnv("DATABASE_SSL"), env === "production"),
  },
  jwt: {
    secret: getEnv("JWT_SECRET") || "",
    expiresIn: getEnv("JWT_EXPIRES_IN") || "7d",
    accessSecret: getEnv("JWT_ACCESS_SECRET", "JWT_SECRET") || "",
    refreshSecret: getEnv("JWT_REFRESH_SECRET", "JWT_SECRET") || "",
    accessExpiresIn: getEnv("JWT_ACCESS_EXPIRES_IN", "JWT_EXPIRES_IN") || "15m",
    refreshExpiresIn: getEnv("JWT_REFRESH_EXPIRES_IN") || "30d",
    accessCookieName: getEnv("JWT_ACCESS_COOKIE_NAME") || "task_tracker_access_token",
    refreshCookieName: getEnv("JWT_REFRESH_COOKIE_NAME") || "task_tracker_refresh_token",
  },
  cors: {
    allowedOrigins:
      configuredOrigins.length > 0
        ? configuredOrigins
        : ["http://localhost:3000", "http://localhost:3001"],
  },
  security: {
    trustProxy: getEnv("TRUST_PROXY") || "loopback",
  },
  rateLimits: {
    global: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_GLOBAL_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_GLOBAL_LIMIT"), 300),
    },
    auth: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_AUTH_WINDOW_MS"), 15 * 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_AUTH_LIMIT"), 40),
    },
    ai: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_AI_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_AI_LIMIT"), 40),
    },
    search: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_SEARCH_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_SEARCH_LIMIT"), 90),
    },
    dashboard: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_DASHBOARD_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_DASHBOARD_LIMIT"), 60),
    },
    chatRead: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_CHAT_READ_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_CHAT_READ_LIMIT"), 120),
    },
    chatWrite: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_CHAT_WRITE_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_CHAT_WRITE_LIMIT"), 45),
    },
    projectRead: {
      windowMs: parseNumber(getEnv("RATE_LIMIT_PROJECT_READ_WINDOW_MS"), 60 * 1000),
      limit: parseNumber(getEnv("RATE_LIMIT_PROJECT_READ_LIMIT"), 90),
    },
  },
  throttles: {
    global: {
      windowMs: parseNumber(getEnv("THROTTLE_GLOBAL_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_GLOBAL_DELAY_AFTER"), 60),
      delayMs: parseNumber(getEnv("THROTTLE_GLOBAL_DELAY_MS"), 150),
      maxDelayMs: parseNumber(getEnv("THROTTLE_GLOBAL_MAX_DELAY_MS"), 1200),
    },
    auth: {
      windowMs: parseNumber(getEnv("THROTTLE_AUTH_WINDOW_MS"), 15 * 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_AUTH_DELAY_AFTER"), 5),
      delayMs: parseNumber(getEnv("THROTTLE_AUTH_DELAY_MS"), 500),
      maxDelayMs: parseNumber(getEnv("THROTTLE_AUTH_MAX_DELAY_MS"), 4000),
    },
    ai: {
      windowMs: parseNumber(getEnv("THROTTLE_AI_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_AI_DELAY_AFTER"), 4),
      delayMs: parseNumber(getEnv("THROTTLE_AI_DELAY_MS"), 400),
      maxDelayMs: parseNumber(getEnv("THROTTLE_AI_MAX_DELAY_MS"), 2500),
    },
    search: {
      windowMs: parseNumber(getEnv("THROTTLE_SEARCH_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_SEARCH_DELAY_AFTER"), 15),
      delayMs: parseNumber(getEnv("THROTTLE_SEARCH_DELAY_MS"), 200),
      maxDelayMs: parseNumber(getEnv("THROTTLE_SEARCH_MAX_DELAY_MS"), 1500),
    },
    dashboard: {
      windowMs: parseNumber(getEnv("THROTTLE_DASHBOARD_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_DASHBOARD_DELAY_AFTER"), 10),
      delayMs: parseNumber(getEnv("THROTTLE_DASHBOARD_DELAY_MS"), 250),
      maxDelayMs: parseNumber(getEnv("THROTTLE_DASHBOARD_MAX_DELAY_MS"), 1500),
    },
    chatRead: {
      windowMs: parseNumber(getEnv("THROTTLE_CHAT_READ_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_CHAT_READ_DELAY_AFTER"), 30),
      delayMs: parseNumber(getEnv("THROTTLE_CHAT_READ_DELAY_MS"), 120),
      maxDelayMs: parseNumber(getEnv("THROTTLE_CHAT_READ_MAX_DELAY_MS"), 1000),
    },
    chatWrite: {
      windowMs: parseNumber(getEnv("THROTTLE_CHAT_WRITE_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_CHAT_WRITE_DELAY_AFTER"), 8),
      delayMs: parseNumber(getEnv("THROTTLE_CHAT_WRITE_DELAY_MS"), 350),
      maxDelayMs: parseNumber(getEnv("THROTTLE_CHAT_WRITE_MAX_DELAY_MS"), 3000),
    },
    projectRead: {
      windowMs: parseNumber(getEnv("THROTTLE_PROJECT_READ_WINDOW_MS"), 60 * 1000),
      delayAfter: parseNumber(getEnv("THROTTLE_PROJECT_READ_DELAY_AFTER"), 20),
      delayMs: parseNumber(getEnv("THROTTLE_PROJECT_READ_DELAY_MS"), 180),
      maxDelayMs: parseNumber(getEnv("THROTTLE_PROJECT_READ_MAX_DELAY_MS"), 1200),
    },
  },
};
