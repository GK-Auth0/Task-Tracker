import { Request, Response } from "express";
import { Project, ProjectMember, Sprint, Task, User } from "../models";

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
    where: { project_id: projectId, user_id: userId },
    attributes: ["id"],
  });

  return membership ? project : null;
};

const SPRINT_NAME_PATTERN = /^Sprint[-\s]?(\d+)$/i;

const getNextGeneratedSprintName = async (projectId: string) => {
  const existingSprints = await Sprint.findAll({
    where: { project_id: projectId },
    attributes: ["name"],
  });

  const sprintNumbers = existingSprints
    .map((sprint) => String(sprint.name || "").match(SPRINT_NAME_PATTERN))
    .map((match) => (match ? Number.parseInt(match[1], 10) : null))
    .filter((value): value is number => Number.isFinite(value ?? NaN));

  const nextNumber = sprintNumbers.length ? Math.max(...sprintNumbers) + 1 : 1;
  return `Sprint-${nextNumber}`;
};

const serializeSprint = (sprint: any) => ({
  id: sprint.id,
  name: sprint.name,
  goal: sprint.goal,
  release: sprint.release,
  squad: sprint.squad,
  project_id: sprint.project_id,
  owner_id: sprint.owner_id,
  capacity: sprint.capacity,
  start_date: sprint.start_date,
  end_date: sprint.end_date,
  status: sprint.status,
  created_at: sprint.created_at,
  updated_at: sprint.updated_at,
  project: sprint.project
    ? { id: sprint.project.id, name: sprint.project.name }
    : null,
  owner: sprint.owner
    ? {
        id: sprint.owner.id,
        full_name: sprint.owner.full_name,
        email: sprint.owner.email,
      }
    : null,
  tasks_count: Array.isArray(sprint.tasks) ? sprint.tasks.length : sprint.tasks_count || 0,
});

export const listSprints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const organizationId = await getRequesterOrganizationId(userId);
    if (!organizationId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const where: any = {};
    if (req.query.project_id) where.project_id = String(req.query.project_id);

    const sprints = await Sprint.findAll({
      where,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["id", "organization_id"],
              where: { organization_id: organizationId },
            },
          ],
        },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "tasks", attributes: ["id"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: sprints.map((item) => serializeSprint(item.get({ plain: true }))),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sprints",
      error: (error as any)?.message,
    });
  }
};

export const createSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const projectId = String(req.body.project_id || "");
    const taskIds = Array.isArray(req.body.task_ids)
      ? req.body.task_ids.map((id: unknown) => String(id))
      : [];
    const ownerId = req.body.owner_id ? String(req.body.owner_id) : userId;

    const project = await ensureProjectAccess(projectId, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    const organizationId = await getRequesterOrganizationId(userId);
    const owner = await User.findOne({
      where: {
        id: ownerId,
        organization_id: organizationId || undefined,
      },
      attributes: ["id"],
    });

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "Sprint owner must belong to the same organization",
      });
    }

    if (taskIds.length) {
      const linkedTasks = await Task.findAll({
        where: {
          id: taskIds,
          project_id: projectId,
        },
        attributes: ["id"],
      });

      if (linkedTasks.length !== taskIds.length) {
        return res.status(400).json({
          success: false,
          message: "All selected tasks must belong to the selected project",
        });
      }
    }

    const requestedName = String(req.body.name || "").trim();
    const sprintName =
      !requestedName || requestedName === "AUTO_SPRINT_NAME"
        ? await getNextGeneratedSprintName(projectId)
        : requestedName;

    const sprint = await Sprint.create({
      name: sprintName,
      goal: req.body.goal ? String(req.body.goal).trim() : null,
      release: req.body.release ? String(req.body.release).trim() : null,
      squad: req.body.squad ? String(req.body.squad).trim() : null,
      project_id: projectId,
      owner_id: ownerId,
      capacity: req.body.capacity ? Number(req.body.capacity) : null,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      status: req.body.status || "Active",
    });

    if (taskIds.length) {
      await Task.update({ sprint_id: sprint.id }, { where: { id: taskIds } });
    }

    const created = await Sprint.findByPk(sprint.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "tasks", attributes: ["id"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Sprint created successfully",
      data: serializeSprint(created?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create sprint",
      error: (error as any)?.message,
    });
  }
};
