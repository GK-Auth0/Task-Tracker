import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard";

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
