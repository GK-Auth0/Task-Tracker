import { Request, Response } from "express";
import { getAllUsers, getUserById } from "../services/user";
import { parseBoundedInt } from "../helpers/query";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseBoundedInt(req.query.page, 1, 1, 100000);
    const limit = parseBoundedInt(req.query.limit, 10, 1, 100);
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
