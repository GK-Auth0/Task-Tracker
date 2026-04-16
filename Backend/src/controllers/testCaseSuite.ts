import { Request, Response } from "express";
import { Op } from "sequelize";
import { Project, ProjectMember, TestCase, TestCaseSuite, User } from "../models";

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

const serializeSuite = (suite: any) => ({
  id: suite.id,
  name: suite.name,
  project_id: suite.project_id,
  owner_id: suite.owner_id,
  created_at: suite.created_at,
  updated_at: suite.updated_at,
  project: suite.project
    ? {
        id: suite.project.id,
        name: suite.project.name,
      }
    : null,
  owner: suite.owner
    ? {
        id: suite.owner.id,
        full_name: suite.owner.full_name,
        email: suite.owner.email,
      }
    : null,
});

export const listTestCaseSuites = async (req: AuthenticatedRequest, res: Response) => {
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

    const suites = await TestCaseSuite.findAll({
      where,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
      ],
      order: [["name", "ASC"]],
    });

    const existingTestCases = await TestCase.findAll({
      where,
      attributes: ["project_id", "suite"],
      order: [["suite", "ASC"]],
    });

    const suiteMap = new Map<string, any>();

    suites.forEach((item) => {
      const plainSuite = serializeSuite(item.get({ plain: true }));
      const key = `${plainSuite.project_id}:${plainSuite.name.toLowerCase()}`;
      suiteMap.set(key, plainSuite);
    });

    existingTestCases.forEach((item) => {
      const plainCase = item.get({ plain: true }) as { project_id: string; suite: string };
      const suiteName = String(plainCase.suite || "").trim();
      if (!suiteName) return;

      const key = `${plainCase.project_id}:${suiteName.toLowerCase()}`;
      if (suiteMap.has(key)) return;

      suiteMap.set(key, {
        id: `existing-${plainCase.project_id}-${suiteName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: suiteName,
        project_id: plainCase.project_id,
        owner_id: null,
        created_at: null,
        updated_at: null,
        project: null,
        owner: null,
      });
    });

    const mergedSuites = Array.from(suiteMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    return res.status(200).json({
      success: true,
      data: mergedSuites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test case suites",
      error: (error as any)?.message,
    });
  }
};

export const createTestCaseSuite = async (req: AuthenticatedRequest, res: Response) => {
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

    const existing = await TestCaseSuite.findOne({
      where: {
        project_id: projectId,
        name,
      },
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
      ],
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Test case suite already exists",
        data: serializeSuite(existing.get({ plain: true })),
      });
    }

    const created = await TestCaseSuite.create({
      name,
      project_id: projectId,
      owner_id: userId,
    });

    const saved = await TestCaseSuite.findByPk(created.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Test case suite created successfully",
      data: serializeSuite(saved?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create test case suite",
      error: (error as any)?.message,
    });
  }
};
