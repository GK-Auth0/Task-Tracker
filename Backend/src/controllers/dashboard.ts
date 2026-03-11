import { Request, Response } from "express";
import {
  getDashboardInsights,
  getDashboardOverview,
  getDashboardSummary,
} from "../services/dashboard";
import { getCache, setCache } from "task-tracker-cache";

const buildDashboardCacheKey = (
  key: "summary" | "overview" | "insights",
  userId: string,
  suffix?: string,
) => `dashboard:${key}:${userId}${suffix ? `:${suffix}` : ""}`;

const DASHBOARD_CACHE_TTL_SECONDS = 60;

const safeGetCache = async <T>(key: string): Promise<T | null> => {
  try {
    return await getCache<T>(key);
  } catch (error) {
    console.warn("[cache] Failed to read cache:", error);
    return null;
  }
};

const safeSetCache = async <T>(key: string, value: T, ttlSeconds: number) => {
  try {
    await setCache(key, value, ttlSeconds);
  } catch (error) {
    console.warn("[cache] Failed to write cache:", error);
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const cacheKey = buildDashboardCacheKey("summary", userId);
    const cachedSummary = await safeGetCache<any>(cacheKey);
    if (cachedSummary) {
      return res.status(200).json({
        success: true,
        message: "Dashboard summary retrieved successfully",
        data: cachedSummary,
      });
    }

    const summary = await getDashboardSummary(userId);
    await safeSetCache(cacheKey, summary, DASHBOARD_CACHE_TTL_SECONDS);
    return res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get dashboard summary",
      error: (error as any).message,
    });
  }
};

export const getOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const upcomingLimit = Number.parseInt(String(req.query.upcomingLimit || "12"), 10);
    const activityLimit = Number.parseInt(String(req.query.activityLimit || "10"), 10);
    const cacheKey = buildDashboardCacheKey(
      "overview",
      userId,
      `${Number.isFinite(upcomingLimit) ? upcomingLimit : 12}:${Number.isFinite(activityLimit) ? activityLimit : 10}`,
    );
    const cachedOverview = await safeGetCache<any>(cacheKey);
    if (cachedOverview) {
      return res.status(200).json({
        success: true,
        message: "Dashboard overview retrieved successfully",
        data: cachedOverview,
      });
    }

    const overview = await getDashboardOverview(userId, {
      upcomingLimit: Number.isFinite(upcomingLimit) ? upcomingLimit : 12,
      activityLimit: Number.isFinite(activityLimit) ? activityLimit : 10,
    });

    await safeSetCache(cacheKey, overview, DASHBOARD_CACHE_TTL_SECONDS);
    return res.status(200).json({
      success: true,
      message: "Dashboard overview retrieved successfully",
      data: overview,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get dashboard overview",
      error: (error as any).message,
    });
  }
};

export const getInsights = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const cacheKey = buildDashboardCacheKey("insights", userId);
    const cachedInsights = await safeGetCache<any>(cacheKey);
    if (cachedInsights) {
      return res.status(200).json({
        success: true,
        message: "Dashboard insights retrieved successfully",
        data: cachedInsights,
      });
    }

    const insights = await getDashboardInsights(userId);
    await safeSetCache(cacheKey, insights, DASHBOARD_CACHE_TTL_SECONDS);
    return res.status(200).json({
      success: true,
      message: "Dashboard insights retrieved successfully",
      data: insights,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get dashboard insights",
      error: (error as any).message,
    });
  }
};
