import { Request, Response } from "express";
import {
  getDashboardInsights,
  getDashboardOverview,
  getDashboardSummary,
} from "../services/dashboard";

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

    const summary = await getDashboardSummary(userId);
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
    const overview = await getDashboardOverview(userId, {
      upcomingLimit: Number.isFinite(upcomingLimit) ? upcomingLimit : 12,
      activityLimit: Number.isFinite(activityLimit) ? activityLimit : 10,
    });

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

    const insights = await getDashboardInsights(userId);
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
