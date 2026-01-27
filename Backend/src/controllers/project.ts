import { Request, Response } from "express";
import { handleValidationErrors } from "../utils/validation";
import { getAllProjects, createProject, getProjectById } from "../services/project";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const projects = await getAllProjects(userId);
    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get projects",
      error: (error as any).message,
    });
  }
};

export const createNewProject = async (req: Request, res: Response) => {
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

    const projectData = {
      name: req.body.name,
      description: req.body.description,
      owner_id: userId,
    };

    const project = await createProject(projectData);
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create project",
      error: (error as any).message,
    });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const projectId = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const project = await getProjectById(projectId, userId);
    return res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get project",
      error: (error as any).message,
    });
  }
};