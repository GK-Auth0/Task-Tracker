import { Op } from "sequelize";
import {
  ACTIVE_TASK_STATUSES,
  DONE_TASK_STATUSES,
  TODO_TASK_STATUSES,
  isActiveTaskStatus,
  isDoneTaskStatus,
} from "../utils/taskStatus";
import { Request, Response } from "express";
import { Defect, Project, ProjectMember, Sprint, Task, TestCase, User } from "../models";

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

const serializeTaskSummary = (task: any) => ({
  id: task.id,
  title: task.title,
  status: task.status,
  priority: task.priority,
  issue_type: task.issue_type,
  due_date: task.due_date,
  updated_at: task.updated_at,
  project: task.project ? { id: task.project.id, name: task.project.name } : null,
  assignee: task.assignee
    ? {
        id: task.assignee.id,
        full_name: task.assignee.full_name,
        email: task.assignee.email,
      }
    : null,
});

const getDateKey = (value?: string | Date | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const diffInDays = (value?: string | Date | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  return Math.round((target - start) / 86400000);
};

const getSprintFamilyRecords = async (sprintId: string, userId: string, role?: string) => {
  const sprint = await getSprintWithAccess(sprintId, userId, role);
  if (!sprint) return null;

  const organizationId = await getRequesterOrganizationId(userId);
  if (!organizationId) return null;

  const family = await Sprint.findAll({
    where: { name: sprint.name },
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "name", "owner_id"],
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
      {
        model: Task,
        as: "tasks",
        attributes: [
          "id",
          "title",
          "status",
          "priority",
          "issue_type",
          "due_date",
          "updated_at",
          "created_at",
          "project_id",
          "assignee_id",
        ],
        include: [
          { model: Project, as: "project", attributes: ["id", "name"] },
          { model: User, as: "assignee", attributes: ["id", "full_name", "email"] },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return family;
};

const buildSprintInsights = async (familyRecords: Sprint[]) => {
  const familyIds = familyRecords.map((item) => item.id);
  const familyNames = Array.from(new Set(familyRecords.map((item) => item.name).filter(Boolean)));

  const allTasks = familyRecords.flatMap((item) => item.tasks || []);
  const defects = await Defect.findAll({
    where: {
      [Op.or]: [
        { sprint_id: { [Op.in]: familyIds } },
        { sprint_id: null, sprint_name: { [Op.in]: familyNames } },
      ],
    },
    attributes: ["id", "status", "priority", "severity", "project_id", "assignee_id"],
    include: [
      { model: Project, as: "project", attributes: ["id", "name"] },
      { model: User, as: "assignee", attributes: ["id", "full_name", "email"] },
    ],
  });
  const testCases = await TestCase.findAll({
    where: {
      [Op.or]: [
        { sprint_id: { [Op.in]: familyIds } },
        { sprint_id: null, sprint_name: { [Op.in]: familyNames } },
      ],
    },
    attributes: ["id", "status", "project_id", "owner_id"],
    include: [
      { model: Project, as: "project", attributes: ["id", "name"] },
      { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
    ],
  });

  const today = new Date();
  const trend = Array.from({ length: 7 }, (_, index) => {
    const pointDate = new Date(today);
    pointDate.setDate(today.getDate() - (6 - index));
    const key = pointDate.toISOString().slice(0, 10);
    const added = allTasks.filter((task: any) => getDateKey(task.created_at) === key).length;
    const completed = allTasks.filter(
      (task: any) => isDoneTaskStatus(task.status) && getDateKey(task.updated_at) === key,
    ).length;
    const inProgress = allTasks.filter(
      (task: any) => isActiveTaskStatus(task.status) && getDateKey(task.updated_at) === key,
    ).length;
    return { date: key, added, completed, in_progress: inProgress };
  });

  type LaggingPersonEntry = {
    id: string;
    full_name: string;
    email: string;
    overdue_tasks: number;
    in_progress_tasks: number;
    high_priority_open: number;
    project_names: Set<string>;
    sample_tasks: Array<{
      id: string;
      title: string;
      due_date?: string | Date | null;
      status: string;
    }>;
  };

  const laggingPeopleMap = new Map<string, LaggingPersonEntry>();

  allTasks.forEach((task: any) => {
    if (!task.assignee?.id || isDoneTaskStatus(task.status)) return;
    const overdue = diffInDays(task.due_date);
    const key = task.assignee.id;
    const current: LaggingPersonEntry = laggingPeopleMap.get(key) || {
      id: task.assignee.id,
      full_name: task.assignee.full_name,
      email: task.assignee.email,
      overdue_tasks: 0,
      in_progress_tasks: 0,
      high_priority_open: 0,
      project_names: new Set<string>(),
      sample_tasks: [],
    };
    if (overdue !== null && overdue < 0) current.overdue_tasks += 1;
    if (isActiveTaskStatus(task.status)) current.in_progress_tasks += 1;
    if (task.priority === "High") current.high_priority_open += 1;
    if (task.project?.name) current.project_names.add(task.project.name);
    if (current.sample_tasks.length < 3) {
      current.sample_tasks.push({
        id: task.id,
        title: task.title,
        due_date: task.due_date,
        status: task.status,
      });
    }
    laggingPeopleMap.set(key, current);
  });

  const projectBreakdown = familyRecords.map((record) => {
    const projectTasks = allTasks.filter((task: any) => task.project_id === record.project_id);
    const projectDefects = defects.filter((item: any) => item.project_id === record.project_id);
    const projectCases = testCases.filter((item: any) => item.project_id === record.project_id);
    return {
      sprint_id: record.id,
      project: record.project
        ? { id: record.project.id, name: record.project.name }
        : null,
      owner: record.owner
        ? {
            id: record.owner.id,
            full_name: record.owner.full_name,
            email: record.owner.email,
          }
        : null,
      release: record.release || null,
      status: record.status,
      capacity: record.capacity ?? null,
      task_status: {
        todo: projectTasks.filter((task: any) => TODO_TASK_STATUSES.includes(task.status)).length,
        in_progress: projectTasks.filter((task: any) => ACTIVE_TASK_STATUSES.includes(task.status)).length,
        done: projectTasks.filter((task: any) => DONE_TASK_STATUSES.includes(task.status)).length,
      },
      overdue_tasks: projectTasks.filter((task: any) => {
        const diff = diffInDays(task.due_date);
        return !isDoneTaskStatus(task.status) && diff !== null && diff < 0;
      }).length,
      open_defects: projectDefects.filter((item: any) => item.status !== "Resolved").length,
      failed_test_cases: projectCases.filter((item: any) => item.status === "Failed").length,
    };
  });

  return {
    summary: {
      projects: familyRecords.length,
      tasks_total: allTasks.length,
      tasks_todo: allTasks.filter((task: any) => TODO_TASK_STATUSES.includes(task.status)).length,
      tasks_in_progress: allTasks.filter((task: any) => ACTIVE_TASK_STATUSES.includes(task.status)).length,
      tasks_done: allTasks.filter((task: any) => DONE_TASK_STATUSES.includes(task.status)).length,
      overdue_tasks: allTasks.filter((task: any) => {
        const diff = diffInDays(task.due_date);
        return !isDoneTaskStatus(task.status) && diff !== null && diff < 0;
      }).length,
      unassigned_tasks: allTasks.filter((task: any) => !task.assignee?.id).length,
      open_defects: defects.filter((item: any) => item.status !== "Resolved").length,
      failed_test_cases: testCases.filter((item: any) => item.status === "Failed").length,
    },
    trend,
    project_breakdown: projectBreakdown,
    lagging_people: Array.from(laggingPeopleMap.values())
      .filter((item) => item.overdue_tasks > 0 || item.in_progress_tasks > 1 || item.high_priority_open > 0)
      .sort(
        (first, second) =>
          second.overdue_tasks - first.overdue_tasks ||
          second.high_priority_open - first.high_priority_open ||
          second.in_progress_tasks - first.in_progress_tasks,
      )
      .slice(0, 6)
      .map((item) => ({
        ...item,
        project_names: Array.from(item.project_names),
      })),
    task_status_breakdown: {
      todo: allTasks.filter((task: any) => TODO_TASK_STATUSES.includes(task.status)).map(serializeTaskSummary),
      in_progress: allTasks.filter((task: any) => ACTIVE_TASK_STATUSES.includes(task.status)).map(serializeTaskSummary),
      done: allTasks.filter((task: any) => DONE_TASK_STATUSES.includes(task.status)).map(serializeTaskSummary),
    },
  };
};

const getSprintWithAccess = async (sprintId: string, userId: string, role?: string) => {
  const sprint = await Sprint.findByPk(sprintId, {
    include: [
      { model: Project, as: "project", attributes: ["id", "name", "owner_id"] },
      { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
      { model: Task, as: "tasks", attributes: ["id", "title", "status", "project_id", "sprint_id"] },
    ],
  });

  if (!sprint) return null;
  const project = await ensureProjectAccess(sprint.project_id, userId, role);
  if (!project) return null;
  return sprint;
};

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
    if (req.query.status) where.status = String(req.query.status);

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

export const getSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const sprint = await getSprintWithAccess(String(req.params.id || ""), userId, req.user?.role);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    return res.status(200).json({
      success: true,
      data: serializeSprint(sprint.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sprint",
      error: (error as any)?.message,
    });
  }
};

export const getSprintInsightsRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const familyRecords = await getSprintFamilyRecords(
      String(req.params.id || ""),
      userId,
      req.user?.role,
    );
    if (!familyRecords?.length) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    const primary = familyRecords[0];
    const insights = await buildSprintInsights(familyRecords);

    return res.status(200).json({
      success: true,
      data: {
        sprint: serializeSprint(primary.get({ plain: true })),
        sprint_family: familyRecords.map((item) => serializeSprint(item.get({ plain: true }))),
        insights,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sprint insights",
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

    const existingSprint = await Sprint.findOne({
      where: {
        project_id: projectId,
        name: sprintName,
      },
      attributes: ["id"],
    });
    if (existingSprint) {
      return res.status(400).json({
        success: false,
        message: "A sprint with this name already exists in the selected project",
      });
    }

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

export const updateSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const sprint = await getSprintWithAccess(String(req.params.id || ""), userId, req.user?.role);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    const updates: Record<string, unknown> = {};
    const nextOwnerId = req.body.owner_id ? String(req.body.owner_id) : undefined;
    if (nextOwnerId) {
      const organizationId = await getRequesterOrganizationId(userId);
      const owner = await User.findOne({
        where: { id: nextOwnerId, organization_id: organizationId || undefined },
        attributes: ["id"],
      });
      if (!owner) {
        return res.status(400).json({
          success: false,
          message: "Sprint owner must belong to the same organization",
        });
      }
      updates.owner_id = nextOwnerId;
    }

    if (req.body.name !== undefined) {
      const nextName = String(req.body.name || "").trim();
      if (!nextName) {
        return res.status(400).json({ success: false, message: "Sprint name cannot be empty" });
      }
      const duplicate = await Sprint.findOne({
        where: {
          project_id: sprint.project_id,
          name: nextName,
        },
        attributes: ["id"],
      });
      if (duplicate && duplicate.id !== sprint.id) {
        return res.status(400).json({
          success: false,
          message: "A sprint with this name already exists in the selected project",
        });
      }
      updates.name = nextName;
    }

    if (req.body.goal !== undefined) updates.goal = req.body.goal ? String(req.body.goal).trim() : null;
    if (req.body.release !== undefined) updates.release = req.body.release ? String(req.body.release).trim() : null;
    if (req.body.squad !== undefined) updates.squad = req.body.squad ? String(req.body.squad).trim() : null;
    if (req.body.capacity !== undefined) updates.capacity = req.body.capacity ? Number(req.body.capacity) : null;
    if (req.body.start_date !== undefined) updates.start_date = req.body.start_date || null;
    if (req.body.end_date !== undefined) updates.end_date = req.body.end_date || null;
    if (req.body.status !== undefined) updates.status = req.body.status;

    await sprint.update(updates);

    const updated = await getSprintWithAccess(sprint.id, userId, req.user?.role);
    return res.status(200).json({
      success: true,
      message: "Sprint updated successfully",
      data: serializeSprint(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update sprint",
      error: (error as any)?.message,
    });
  }
};

export const startSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const sprint = await getSprintWithAccess(String(req.params.id || ""), userId, req.user?.role);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    const activeConflict = await Sprint.findOne({
      where: {
        project_id: sprint.project_id,
        status: "Active",
      },
      attributes: ["id", "name"],
    });
    if (activeConflict && activeConflict.id !== sprint.id) {
      return res.status(400).json({
        success: false,
        message: `Sprint ${activeConflict.name} is already active for this project`,
      });
    }

    await sprint.update({
      status: "Active",
      start_date: req.body.start_date || sprint.start_date || new Date().toISOString().slice(0, 10),
      end_date: req.body.end_date !== undefined ? req.body.end_date || null : sprint.end_date,
    });

    const updated = await getSprintWithAccess(sprint.id, userId, req.user?.role);
    return res.status(200).json({
      success: true,
      message: "Sprint started successfully",
      data: serializeSprint(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start sprint",
      error: (error as any)?.message,
    });
  }
};

export const completeSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const sprint = await getSprintWithAccess(String(req.params.id || ""), userId, req.user?.role);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    const destinationSprintId = req.body.destination_sprint_id
      ? String(req.body.destination_sprint_id)
      : "";
    const moveOpenTasksToBacklog = Boolean(req.body.move_open_tasks_to_backlog || !destinationSprintId);
    const openTaskIds = (sprint.tasks || [])
      .filter((task: any) => task.status !== "Done")
      .map((task: any) => task.id);

    if (destinationSprintId) {
      const destinationSprint = await Sprint.findOne({
        where: { id: destinationSprintId, project_id: sprint.project_id },
        attributes: ["id"],
      });
      if (!destinationSprint) {
        return res.status(400).json({
          success: false,
          message: "Destination sprint must belong to the same project",
        });
      }
      if (openTaskIds.length) {
        await Task.update({ sprint_id: destinationSprintId }, { where: { id: openTaskIds } });
      }
    } else if (moveOpenTasksToBacklog && openTaskIds.length) {
      await Task.update({ sprint_id: null }, { where: { id: openTaskIds } });
    }

    await sprint.update({
      status: "Completed",
      end_date: req.body.end_date || sprint.end_date || new Date().toISOString().slice(0, 10),
    });

    const updated = await getSprintWithAccess(sprint.id, userId, req.user?.role);
    return res.status(200).json({
      success: true,
      message: "Sprint completed successfully",
      data: serializeSprint(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete sprint",
      error: (error as any)?.message,
    });
  }
};

export const addTasksToSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const sprint = await getSprintWithAccess(String(req.params.id || ""), userId, req.user?.role);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    const taskIds = Array.isArray(req.body.task_ids)
      ? req.body.task_ids.map((id: unknown) => String(id))
      : [];
    if (!taskIds.length) {
      return res.status(400).json({ success: false, message: "At least one task is required" });
    }

    const linkedTasks = await Task.findAll({
      where: {
        id: taskIds,
        project_id: sprint.project_id,
      },
      attributes: ["id"],
    });
    if (linkedTasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        message: "All selected tasks must belong to the selected project",
      });
    }

    await Task.update({ sprint_id: sprint.id }, { where: { id: taskIds } });
    const updated = await getSprintWithAccess(sprint.id, userId, req.user?.role);

    return res.status(200).json({
      success: true,
      message: "Tasks added to sprint successfully",
      data: serializeSprint(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add tasks to sprint",
      error: (error as any)?.message,
    });
  }
};

export const removeTaskFromSprintRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const sprint = await getSprintWithAccess(String(req.params.id || ""), userId, req.user?.role);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    const task = await Task.findOne({
      where: {
        id: String(req.params.taskId || ""),
        project_id: sprint.project_id,
        sprint_id: sprint.id,
      },
      attributes: ["id"],
    });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found in sprint" });
    }

    await task.update({ sprint_id: null });
    const updated = await getSprintWithAccess(sprint.id, userId, req.user?.role);
    return res.status(200).json({
      success: true,
      message: "Task removed from sprint successfully",
      data: serializeSprint(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove task from sprint",
      error: (error as any)?.message,
    });
  }
};
