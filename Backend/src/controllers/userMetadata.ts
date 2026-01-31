import { Request, Response } from "express";
import { UserMetadata } from "../models";

export const getUserMetadata = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const metadata = await UserMetadata.findOne({
      where: { user_id: userId }
    });

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: "User metadata not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User metadata retrieved",
      data: metadata,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get user metadata",
      error: (error as any).message,
    });
  }
};