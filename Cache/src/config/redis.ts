import { createClient, type RedisClientType } from "redis";

export type RedisConfig = {
  enabled: boolean;
  url?: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  tls: boolean;
  rejectUnauthorized: boolean;
  keyPrefix: string;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return fallback;
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
};

export const redisConfig: RedisConfig = {
  enabled:
    parseBoolean(getEnv("REDIS_ENABLED"), false) ||
    Boolean(getEnv("REDIS_URL") || getEnv("REDIS_HOST")),
  url: getEnv("REDIS_URL"),
  host: (getEnv("REDIS_HOST") || "localhost") === "localhost" ? "127.0.0.1" : (getEnv("REDIS_HOST") as string),
  port: parseNumber(getEnv("REDIS_PORT"), 6379),
  username: getEnv("REDIS_USERNAME"),
  password: getEnv("REDIS_PASSWORD"),
  db: parseNumber(getEnv("REDIS_DB"), 0),
  tls: parseBoolean(getEnv("REDIS_TLS"), false),
  rejectUnauthorized: parseBoolean(getEnv("REDIS_TLS_REJECT_UNAUTHORIZED"), true),
  keyPrefix: getEnv("REDIS_KEY_PREFIX") || "",
};

let redisClient: RedisClientType | null = null;
let redisClientPromise: Promise<RedisClientType> | null = null;

const buildRedisClient = () => {
  const baseOptions: Parameters<typeof createClient>[0] = {};

  if (redisConfig.url) {
    baseOptions.url = redisConfig.url;
  } else {
    baseOptions.socket = {
      host: redisConfig.host,
      port: redisConfig.port,
    };
    if (redisConfig.username) baseOptions.username = redisConfig.username;
    if (redisConfig.password) baseOptions.password = redisConfig.password;
    if (Number.isFinite(redisConfig.db)) baseOptions.database = redisConfig.db;
  }

  if (redisConfig.tls) {
    baseOptions.socket = {
      ...(baseOptions.socket ?? {}),
      tls: true,
      rejectUnauthorized: redisConfig.rejectUnauthorized,
    };
  }

  const client = createClient(baseOptions);
  client.on("error", (error) => {
    console.error("[redis] Client error:", error);
  });

  return client;
};

export const getRedisClient = async () => {
  if (!redisConfig.enabled) return null;

  if (redisClient) return redisClient;

  if (!redisClientPromise) {
    redisClient = buildRedisClient();
    redisClientPromise = redisClient.connect().then(() => redisClient as RedisClientType);
  }

  return redisClientPromise;
};

export const closeRedisClient = async () => {
  if (!redisClient) return;

  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    } else {
      await redisClient.disconnect();
    }
  } catch (error) {
    console.error("[redis] Failed to close client:", error);
  } finally {
    redisClient = null;
    redisClientPromise = null;
  }
};
