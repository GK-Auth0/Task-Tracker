import rateLimit from "express-rate-limit";
import { appConfig } from "../config";

const standardResponse = {
  success: false,
  message: "Too many requests. Please try again shortly.",
};

const createRateLimiter = (
  settings: { windowMs: number; limit: number },
  message: { success: boolean; message: string },
) =>
  rateLimit({
    windowMs: settings.windowMs,
    limit: settings.limit,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });

export const globalRateLimiter = createRateLimiter(appConfig.rateLimits.global, standardResponse);

export const authRateLimiter = createRateLimiter(appConfig.rateLimits.auth, {
  success: false,
  message: "Too many authentication attempts. Please try again later.",
});

export const aiRateLimiter = createRateLimiter(appConfig.rateLimits.ai, {
  success: false,
  message: "AI request limit reached. Please wait and retry.",
});

export const searchRateLimiter = createRateLimiter(appConfig.rateLimits.search, {
  success: false,
  message: "Search rate limit reached. Please slow down and retry.",
});

export const dashboardRateLimiter = createRateLimiter(appConfig.rateLimits.dashboard, {
  success: false,
  message: "Dashboard refresh limit reached. Please retry shortly.",
});

export const chatReadRateLimiter = createRateLimiter(appConfig.rateLimits.chatRead, {
  success: false,
  message: "Chat read limit reached. Please retry shortly.",
});

export const chatWriteRateLimiter = createRateLimiter(appConfig.rateLimits.chatWrite, {
  success: false,
  message: "Chat write limit reached. Please slow down before sending more.",
});

export const projectReadRateLimiter = createRateLimiter(appConfig.rateLimits.projectRead, {
  success: false,
  message: "Project read limit reached. Please retry shortly.",
});
