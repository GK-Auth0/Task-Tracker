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
};
