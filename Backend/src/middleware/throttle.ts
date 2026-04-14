import { RequestHandler } from "express";
import { appConfig } from "../config";

type ThrottleSettings = {
  windowMs: number;
  delayAfter: number;
  delayMs: number;
  maxDelayMs: number;
};

type ThrottleEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, ThrottleEntry>();

const getClientKey = (prefix: string, ip: string | undefined) => `${prefix}:${ip || "unknown"}`;

const createThrottle = (prefix: string, settings: ThrottleSettings): RequestHandler => {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(prefix, req.ip);
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + settings.windowMs });
      return next();
    }

    existing.count += 1;

    if (existing.count <= settings.delayAfter) {
      return next();
    }

    const delay = Math.min(
      (existing.count - settings.delayAfter) * settings.delayMs,
      settings.maxDelayMs,
    );

    res.setHeader("X-Throttle-Delay-Ms", String(delay));
    res.setHeader("X-Throttle-Remaining", String(Math.max(settings.delayAfter - existing.count, 0)));

    setTimeout(() => next(), delay);
  };
};

export const globalThrottle = createThrottle("global", appConfig.throttles.global);
export const authThrottle = createThrottle("auth", appConfig.throttles.auth);
export const aiThrottle = createThrottle("ai", appConfig.throttles.ai);
export const searchThrottle = createThrottle("search", appConfig.throttles.search);
export const dashboardThrottle = createThrottle("dashboard", appConfig.throttles.dashboard);
export const chatReadThrottle = createThrottle("chat-read", appConfig.throttles.chatRead);
export const chatWriteThrottle = createThrottle("chat-write", appConfig.throttles.chatWrite);
export const projectReadThrottle = createThrottle("project-read", appConfig.throttles.projectRead);
