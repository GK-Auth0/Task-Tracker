import { Request, Response } from "express";
import { handleValidationErrors } from "../utils/validation";
import { getAllTasks, createTask, getTaskById, updateTask, deleteTask } from "../services/task";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      project_id: req.query.project_id as string,
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await getAllTasks(userId, filters, page, limit);
    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: result.tasks,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get tasks",
      error: (error as any).message,
    });
  }
};

export const createNewTask = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const taskData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || "To Do",
      priority: req.body.priority || "Medium",
      project_id: req.body.project_id,
      assignee_id: req.body.assignee_id,
      creator_id: userId,
      due_date: req.body.due_date,
    };

    const task = await createTask(taskData);
    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create task",
      error: (error as any).message,
    });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const taskId = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const task = await getTaskById(taskId, userId);
    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get task",
      error: (error as any).message,
    });
  }
};

export const updateTaskDetails = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const userId = (req as any).user?.id;
    const taskId = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignee_id: req.body.assignee_id,
      due_date: req.body.due_date,
    };

    const task = await updateTask(taskId, updateData, userId);
    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update task",
      error: (error as any).message,
    });
  }
};

export const removeTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const taskId = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    await deleteTask(taskId, userId);
    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete task",
      error: (error as any).message,
    });
  }
};