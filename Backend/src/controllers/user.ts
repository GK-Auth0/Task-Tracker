import { Request, Response } from "express";
import { getAllUsers, getUserById } from "../services/user";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const role = req.query.role as string || "";
    
    const result = await getAllUsers({ page, limit, search, role });
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get users",
      error: (error as any).message,
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const user = await getUserById(userId);
    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get user",
      error: (error as any).message,
    });
  }
};
