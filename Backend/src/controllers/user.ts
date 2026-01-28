import { Request, Response } from "express";
import { getAllUsers, getUserById } from "../services/user";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
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
