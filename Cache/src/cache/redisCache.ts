import { getRedisClient, redisConfig } from "../config/redis";

const formatKey = (key: string) =>
  redisConfig.keyPrefix ? `${redisConfig.keyPrefix}:${key}` : key;

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = await getRedisClient();
  if (!client) return null;

  const value = await client.get(formatKey(key));
  if (value === null) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

export const setCache = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<boolean> => {
  const client = await getRedisClient();
  if (!client) return false;

  const payload = JSON.stringify(value);

  if (ttlSeconds && ttlSeconds > 0) {
    await client.set(formatKey(key), payload, { EX: ttlSeconds });
  } else {
    await client.set(formatKey(key), payload);
  }

  return true;
};

export const deleteCache = async (key: string): Promise<boolean> => {
  const client = await getRedisClient();
  if (!client) return false;

  const result = await client.del(formatKey(key));
  return result > 0;
};

export const hasCache = async (key: string): Promise<boolean> => {
  const client = await getRedisClient();
  if (!client) return false;

  const result = await client.exists(formatKey(key));
  return result === 1;
};

export const deleteCacheByPrefix = async (prefix: string): Promise<number> => {
  const client = await getRedisClient();
  if (!client) return 0;

  const searchPattern = `${formatKey(prefix)}*`;
  let deleted = 0;

  for await (const key of client.scanIterator({ MATCH: searchPattern, COUNT: 100 })) {
    if (typeof key === "string") {
      const result = await client.del(key);
      deleted += result;
    }
  }

  return deleted;
};
