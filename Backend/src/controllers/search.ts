import { Request, Response } from "express";
import { parseBoundedInt } from "../helpers/query";
import { searchWorkspace } from "../services/search";

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const q = String(req.query.q || "");
    const limit = parseBoundedInt(req.query.limit, 5, 1, 10);
    const result = await searchWorkspace(userId, q, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to search workspace",
      error: (error as any).message,
    });
  }
};
