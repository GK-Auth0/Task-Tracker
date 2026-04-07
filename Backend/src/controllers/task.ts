import { Request, Response } from "express";
import { handleValidationErrors } from "../helpers/validation";
import {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskPullRequests,
  getTaskCommits,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTaskForUpload,
} from "../services/task";
import { createAuditLog, getAuditLogs } from "../services/auditService";
import { processInvites } from "../services/invitation";
import { parseBoundedInt, parseIsoDate } from "../helpers/query";
import { TaskIssueType, TaskPriority, TaskStatus } from "../enums";
import cloudinary from "../config/cloudinary";
import { TaskFile, User } from "../models";

const normalizeTaskPriority = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return String(value);

  const normalized = value.trim().toLowerCase();
  const priorityMap: Record<string, TaskPriority> = {
    low: TaskPriority.LOW,
    medium: TaskPriority.MEDIUM,
    high: TaskPriority.HIGH,
  };

  return priorityMap[normalized] ?? value;
};

const normalizeTaskIssueType = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return String(value);

  const normalized = value.trim().toLowerCase();
  const typeMap: Record<string, TaskIssueType> = {
    story: TaskIssueType.STORY,
    task: TaskIssueType.TASK,
    bug: TaskIssueType.BUG,
  };

  return typeMap[normalized] ?? value;
};

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
      sprint_id: req.query.sprint_id as string,
      due_from: parseIsoDate(req.query.due_from),
      due_to: parseIsoDate(req.query.due_to),
      created_from: parseIsoDate(req.query.created_from),
      created_to: parseIsoDate(req.query.created_to),
    };

    const page = parseBoundedInt(req.query.page, 1, 1, 100000);
    const limit = parseBoundedInt(req.query.limit, 5, 1, 100);

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
      description: String(req.body.description || "").trim(),
      status: req.body.status || TaskStatus.TODO,
      priority: normalizeTaskPriority(req.body.priority) || TaskPriority.MEDIUM,
      issue_type:
        normalizeTaskIssueType(req.body.issue_type) || TaskIssueType.TASK,
      project_id: req.body.project_id,
      assignee_id: req.body.assignee_id,
      defect_id: req.body.defect_id,
      sprint_id: req.body.sprint_id,
      creator_id: userId,
      due_date: req.body.due_date,
    };

    const task = await createTask(taskData);
    const inviteSummary = await processInvites({
      contextType: "task",
      projectId: task.project?.id || task.project_id,
      taskId: task.id,
      invitedBy: userId,
      invitees: Array.isArray(req.body.invitees) ? req.body.invitees : [],
    });
    
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
      data: {
        ...task,
        invite_summary: inviteSummary,
      },
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
      title:
        req.body.title === undefined
          ? undefined
          : String(req.body.title).trim(),
      description:
        req.body.description === undefined
          ? undefined
          : String(req.body.description).trim(),
      status: req.body.status,
      priority:
        req.body.priority === undefined
          ? undefined
          : normalizeTaskPriority(req.body.priority),
      issue_type:
        req.body.issue_type === undefined
          ? undefined
          : normalizeTaskIssueType(req.body.issue_type),
      assignee_id: req.body.assignee_id,
      defect_id: req.body.defect_id,
      sprint_id: req.body.sprint_id,
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

export const createTaskSubtask = async (req: Request, res: Response) => {
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

    const subtask = await createSubtask(
      taskId,
      {
        title: String(req.body.title).trim(),
        assignee_id: req.body.assignee_id,
      },
      userId,
    );

    return res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: subtask,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create subtask",
      error: (error as any).message,
    });
  }
};

export const updateTaskSubtask = async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const userId = (req as any).user?.id;
    const taskId = req.params.id as string;
    const subtaskId = req.params.subtaskId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const subtask = await updateSubtask(
      taskId,
      subtaskId,
      {
        title:
          req.body.title === undefined ? undefined : String(req.body.title).trim(),
        is_completed: req.body.is_completed,
        assignee_id: req.body.assignee_id,
      },
      userId,
    );

    return res.status(200).json({
      success: true,
      message: "Subtask updated successfully",
      data: subtask,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update subtask",
      error: (error as any).message,
    });
  }
};

export const removeTaskSubtask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const taskId = req.params.id as string;
    const subtaskId = req.params.subtaskId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    await deleteSubtask(taskId, subtaskId, userId);

    return res.status(200).json({
      success: true,
      message: "Subtask deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to delete subtask",
      error: (error as any).message,
    });
  }
};

export const uploadTaskAttachment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const taskId = req.params.id as string;
    const file = (req as any).file;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    await getTaskForUpload(taskId, userId);

    const result = await cloudinary.uploader.upload(file.path, {
      folder: `task-tracker/tasks/${taskId}`,
      resource_type: "auto",
    });

    const attachment = await TaskFile.create({
      task_id: taskId,
      filename: result.public_id,
      original_name: file.originalname,
      file_url: result.secure_url,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: userId,
    });

    const attachmentWithUploader = await TaskFile.findByPk(attachment.id, {
      include: [
        {
          model: User,
          as: "uploader",
          attributes: ["id", "full_name", "email"],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      data: attachmentWithUploader,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to upload attachment",
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

export const getTaskActivityLogs = async (req: Request, res: Response) => {
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

    // Ensure requester has access to this task before exposing activity.
    await getTaskById(taskId, userId);

    const limit = parseBoundedInt(req.query.limit, 50, 1, 200);
    const logs = await getAuditLogs("task", taskId, limit);

    return res.status(200).json({
      success: true,
      message: "Task activity retrieved successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get task activity logs",
      error: (error as any).message,
    });
  }
};
