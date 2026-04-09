import { NextFunction, Request, Response } from "express";

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
  statusCode: number;
};

const cacheStore = new Map<string, CacheEntry>();

const getCacheKey = (req: Request) => {
  const userId = (req as any).user?.id || "anonymous";
  return `${req.method}:${userId}:${req.originalUrl}`;
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  cacheStore.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  });
};

export const cacheGetResponse = (ttlMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    cleanupExpiredEntries();

    const key = getCacheKey(req);
    const cached = cacheStore.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return res.status(cached.statusCode).json(cached.payload);
    }

    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          expiresAt: now + ttlMs,
          payload: body,
          statusCode: res.statusCode,
        });
      }

      return originalJson(body);
    }) as Response["json"];

    next();
  };
};
