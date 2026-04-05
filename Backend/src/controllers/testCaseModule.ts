import { Request, Response } from "express";
import { Op } from "sequelize";
import { Project, ProjectMember, TestCaseModule, User } from "../models";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

const isWorkspaceAdmin = (role: unknown) =>
  String(role || "").trim().toLowerCase() === "admin";

const getRequesterOrganizationId = async (userId: string) => {
  const requester = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  return requester?.organization_id || null;
};

const ensureProjectAccess = async (projectId: string, userId: string, role?: string) => {
  const organizationId = await getRequesterOrganizationId(userId);
  if (!organizationId) return null;

  const project = await Project.findOne({
    where: { id: projectId },
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
  });

  if (!project) return null;
  if (project.owner_id === userId || isWorkspaceAdmin(role)) return project;

  const membership = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: userId,
    },
    attributes: ["id"],
  });

  return membership ? project : null;
};

const serializeModule = (module: any) => ({
  id: module.id,
  name: module.name,
  project_id: module.project_id,
  owner_id: module.owner_id,
  created_at: module.created_at,
  updated_at: module.updated_at,
  project: module.project
    ? {
        id: module.project.id,
        name: module.project.name,
      }
    : null,
  owner: module.owner
    ? {
        id: module.owner.id,
        full_name: module.owner.full_name,
        email: module.owner.email,
      }
    : null,
});

export const listTestCaseModules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const organizationId = await getRequesterOrganizationId(userId);
    if (!organizationId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const scopedProjects = await Project.findAll({
      attributes: ["id"],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id"],
          where: { organization_id: organizationId },
        },
      ],
    });

    const projectIds = scopedProjects.map((project) => project.id);
    if (!projectIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const where: any = {
      project_id: { [Op.in]: projectIds },
    };

    if (req.query.project_id) {
      where.project_id = String(req.query.project_id);
    }

    const modules = await TestCaseModule.findAll({
      where,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: modules.map((item) => serializeModule(item.get({ plain: true }))),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test case modules",
      error: (error as any)?.message,
    });
  }
};

export const createTestCaseModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const name = String(req.body.name || "").trim();
    const projectId = String(req.body.project_id || "");

    const project = await ensureProjectAccess(projectId, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    const existing = await TestCaseModule.findOne({
      where: {
        project_id: projectId,
        name,
      },
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
      ],
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Test case module already exists",
        data: serializeModule(existing.get({ plain: true })),
      });
    }

    const created = await TestCaseModule.create({
      name,
      project_id: projectId,
      owner_id: userId,
    });

    const saved = await TestCaseModule.findByPk(created.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Test case module created successfully",
      data: serializeModule(saved?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create test case module",
      error: (error as any)?.message,
    });
  }
};
