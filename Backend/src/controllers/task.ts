import { Request, Response } from "express";
import { handleValidationErrors } from "../utils/validation";
import {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskPullRequests,
  getTaskCommits,
} from "../services/task";
import { createAuditLog } from "../services/auditService";

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

    console.log('Received task data:', req.body);
    console.log('Priority value:', req.body.priority, 'Type:', typeof req.body.priority);

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
    
    // Log task creation
    await createAuditLog({
      entity_type: "task",
      entity_id: task.id,
      action: "created",
      user_id: userId,
      new_values: taskData,
      changes: {
        timestamp: new Date().toISOString(),
        action_time: new Date(),
      },
    });
    
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

    // Get current task data for audit log
    const currentTask = await getTaskById(taskId, userId);
    
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignee_id: req.body.assignee_id,
      due_date: req.body.due_date,
    };

    const task = await updateTask(taskId, updateData, userId);
    
    // Determine audit action and log changes
    let action = "updated";
    const changes: any = {};
    
    if (currentTask.status !== updateData.status && updateData.status) {
      action = "status_changed";
      changes.status = { from: currentTask.status, to: updateData.status };
    }
    
    if (currentTask.assignee?.id !== updateData.assignee_id) {
      if (!currentTask.assignee?.id && updateData.assignee_id) {
        action = "assigned";
      } else if (currentTask.assignee?.id && !updateData.assignee_id) {
        action = "unassigned";
      }
      changes.assignee = { 
        from: currentTask.assignee?.id || null, 
        to: updateData.assignee_id || null 
      };
    }
    
    // Log other changes
    const updateDataKeys = Object.keys(updateData) as (keyof typeof updateData)[];
    updateDataKeys.forEach(key => {
      if (updateData[key] !== undefined && (currentTask as any)[key] !== updateData[key]) {
        changes[key] = { from: (currentTask as any)[key], to: updateData[key] };
      }
    });
    
    // Create audit log
    await createAuditLog({
      entity_type: "task",
      entity_id: taskId,
      action: action as any,
      user_id: userId,
      old_values: currentTask,
      new_values: updateData,
      changes: {
        ...changes,
        timestamp: new Date().toISOString(),
        action_time: new Date(),
      },
    });
    
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

    // Get task data before deletion for audit log
    const task = await getTaskById(taskId, userId);
    
    await deleteTask(taskId, userId);
    
    // Log task deletion
    await createAuditLog({
      entity_type: "task",
      entity_id: taskId,
      action: "deleted",
      user_id: userId,
      old_values: task,
      changes: {
        timestamp: new Date().toISOString(),
        action_time: new Date(),
      },
    });
    
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

export const getTaskPRs = async (req: Request, res: Response) => {
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

    const pullRequests = await getTaskPullRequests(taskId, userId);
    return res.status(200).json({
      success: true,
      message: "Pull requests retrieved successfully",
      data: pullRequests,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get pull requests",
      error: (error as any).message,
    });
  }
};

export const getTaskCommitHistory = async (req: Request, res: Response) => {
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

    const commits = await getTaskCommits(taskId, userId);
    return res.status(200).json({
      success: true,
      message: "Commits retrieved successfully",
      data: commits,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get commits",
      error: (error as any).message,
    });
  }
};
