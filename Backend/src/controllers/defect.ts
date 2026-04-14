import { Request, Response } from "express";
import { TaskPriority, TaskStatus } from "../enums";
import { Op } from "sequelize";
import { Defect, Project, ProjectMember, Sprint, Task, User } from "../models";
import { createAuditLog } from "../services/auditService";
import { createTask } from "../services/task";
import { tableHasColumn } from "../utils/runtimeSchema";
import { parseBoundedInt } from "../helpers/query";

const DEFECT_STATUSES = ["Open", "Approved", "Rejected", "In Progress", "Resolved"] as const;
const DEFECT_SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
const DEFECT_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
const DEFECT_TABLE = "defects";
const DEFECT_ATTRIBUTES = [
  "id",
  "reference_code",
  "title",
  "description",
  "reproduction_steps",
  "severity",
  "priority",
  "status",
  "project_id",
  "linked_task_id",
  "created_task_id",
  "creator_id",
  "assignee_id",
  "sprint_id",
  "sprint_name",
  "linked_run",
  "linked_case",
  "environment",
  "rejection_reason",
  "approved_at",
  "approved_by",
  "rejected_at",
  "rejected_by",
  "created_at",
  "updated_at",
] as const;

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

const isWorkspaceAdmin = (role: unknown) =>
  String(role || "").trim().toLowerCase() === "admin";

const mapDefectPriorityToTaskPriority = (priority: string): "Low" | "Medium" | "High" => {
  if (priority === "Critical" || priority === "High") return "High";
  if (priority === "Medium") return "Medium";
  return "Low";
};

const buildDefectTraceComment = (
  defect: { reference_code?: string; title?: string; status?: string },
  message: string,
) => {
  const parts = [
    defect.reference_code ? `Defect ${defect.reference_code}` : "Defect",
    defect.title ? `(${defect.title})` : "",
    message,
  ].filter(Boolean);
  return parts.join(" ");
};

const createTaskDefectAuditLog = async ({
  taskId,
  userId,
  defect,
  comment,
  oldValues,
  newValues,
}: {
  taskId?: string | null;
  userId: string;
  defect: { id: string; reference_code?: string; title?: string; status?: string };
  comment: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) => {
  if (!taskId) return;

  await createAuditLog({
    entity_type: "task",
    entity_id: taskId,
    action: "updated",
    user_id: userId,
    old_values: oldValues,
    new_values: newValues,
    changes: {
      comment,
      defect_id: defect.id,
      defect_reference_code: defect.reference_code,
      defect_title: defect.title,
      defect_status: defect.status,
      timestamp: new Date().toISOString(),
      action_time: new Date(),
    },
  });
};

const serializeDefect = (defect: any) => ({
  id: defect.id,
  reference_code: defect.reference_code,
  title: defect.title,
  description: defect.description,
  reproduction_steps: Array.isArray(defect.reproduction_steps)
    ? defect.reproduction_steps
    : [],
  severity: defect.severity,
  priority: defect.priority,
  status: defect.status,
  project_id: defect.project_id,
  sprint_id: defect.sprint_id || defect.sprint?.id || null,
  sprint_name: defect.sprint?.name || defect.sprint_name,
  linked_run: defect.linked_run,
  linked_case: defect.linked_case,
  environment: defect.environment,
  rejection_reason: defect.rejection_reason,
  creator_id: defect.creator_id,
  assignee_id: defect.assignee_id,
  linked_task_id: defect.linked_task_id,
  created_task_id: defect.created_task_id,
  approved_at: defect.approved_at,
  rejected_at: defect.rejected_at,
  created_at: defect.created_at,
  updated_at: defect.updated_at,
  project: defect.project
    ? {
        id: defect.project.id,
        name: defect.project.name,
      }
    : null,
  creator: defect.creator
    ? {
        id: defect.creator.id,
        full_name: defect.creator.full_name,
        email: defect.creator.email,
      }
    : null,
  assignee: defect.assignee
    ? {
        id: defect.assignee.id,
        full_name: defect.assignee.full_name,
        email: defect.assignee.email,
      }
    : null,
  sprint: defect.sprint
    ? {
        id: defect.sprint.id,
        name: defect.sprint.name,
        status: defect.sprint.status,
      }
    : null,
  linked_task: defect.linked_task
    ? {
        id: defect.linked_task.id,
        title: defect.linked_task.title,
      }
    : null,
  created_task: defect.created_task
    ? {
        id: defect.created_task.id,
        title: defect.created_task.title,
      }
    : null,
});

const getRequesterOrganizationId = async (userId: string) => {
  const requester = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  return requester?.organization_id || null;
};

const ensureProjectAccess = async (projectId: string, userId: string, role?: string) => {
  const organizationId = await getRequesterOrganizationId(userId);
  if (!organizationId) {
    return null;
  }

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

const getDefectQueryMetadata = async () => {
  const supportsSprintId = await tableHasColumn(DEFECT_TABLE, "sprint_id");

  return {
    supportsSprintId,
    attributes: supportsSprintId
      ? [...DEFECT_ATTRIBUTES]
      : DEFECT_ATTRIBUTES.filter((attribute) => attribute !== "sprint_id"),
  };
};

export const listDefects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const organizationId = await getRequesterOrganizationId(userId);
    if (!organizationId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { supportsSprintId, attributes } = await getDefectQueryMetadata();
    const page = parseBoundedInt(req.query.page, 1, 1, 100000);
    const limit = parseBoundedInt(req.query.limit, 10, 1, 100);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const where: any = {};

    if (req.query.project_id) where.project_id = String(req.query.project_id);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.sprint_id && supportsSprintId) where.sprint_id = String(req.query.sprint_id);
    if (req.query.sprint_name) where.sprint_name = String(req.query.sprint_name);

    const include = [
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
      {
        model: User,
        as: "creator",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      ...(supportsSprintId
        ? [
            {
              model: Sprint,
              as: "sprint",
              attributes: ["id", "name", "status"],
            },
          ]
        : []),
      {
        model: Task,
        as: "linked_task",
        attributes: ["id", "title"],
      },
      {
        model: Task,
        as: "created_task",
        attributes: ["id", "title"],
      },
    ];

    if (req.query.task_id) {
      const taskId = String(req.query.task_id);
      where[Op.or] = [{ linked_task_id: taskId }, { created_task_id: taskId }];
    }

    if (search) {
      const searchClause = {
        [Op.or]: [
          { reference_code: { [Op.iLike]: `%${search}%` } },
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { "$project.name$": { [Op.iLike]: `%${search}%` } },
          { "$linked_task.title$": { [Op.iLike]: `%${search}%` } },
          { "$created_task.title$": { [Op.iLike]: `%${search}%` } },
        ],
      };

      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, searchClause];
        delete where[Op.or];
      } else {
        where[Op.and] = [searchClause];
      }
    }

    const defects = await Defect.findAndCountAll({
      attributes,
      where,
      include,
      distinct: true,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const filterOptionRows = await Defect.findAll({
      attributes: ["id", "project_id", "sprint_name", "linked_task_id", "created_task_id"],
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
        {
          model: Task,
          as: "linked_task",
          attributes: ["id", "title"],
        },
        {
          model: Task,
          as: "created_task",
          attributes: ["id", "title"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const projects = new Map<string, { id: string; name: string }>();
    const tasks = new Map<string, { id: string; title: string }>();
    const sprints = new Set<string>();

    filterOptionRows.forEach((defect: any) => {
      const plain = defect.get({ plain: true });
      if (plain.project?.id && plain.project?.name) {
        projects.set(plain.project.id, { id: plain.project.id, name: plain.project.name });
      }
      if (plain.linked_task?.id && plain.linked_task?.title) {
        tasks.set(plain.linked_task.id, {
          id: plain.linked_task.id,
          title: plain.linked_task.title,
        });
      }
      if (plain.created_task?.id && plain.created_task?.title) {
        tasks.set(plain.created_task.id, {
          id: plain.created_task.id,
          title: plain.created_task.title,
        });
      }
      const sprintName = String(plain.sprint_name || "").trim();
      if (sprintName) {
        sprints.add(sprintName);
      }
    });

    return res.status(200).json({
      success: true,
      data: defects.rows.map((defect) => serializeDefect(defect.get({ plain: true }))),
      pagination: {
        page,
        limit,
        total: defects.count,
        totalPages: Math.ceil(defects.count / limit),
        hasNext: page < Math.ceil(defects.count / limit),
        hasPrev: page > 1,
      },
      filters: {
        projects: Array.from(projects.values()).sort((a, b) => a.name.localeCompare(b.name)),
        tasks: Array.from(tasks.values()).sort((a, b) => a.title.localeCompare(b.title)),
        sprints: Array.from(sprints.values()).sort((a, b) => a.localeCompare(b)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defects",
      error: (error as any)?.message,
    });
  }
};

export const createDefectRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const projectId = String(req.body.project_id || "");
    const project = await ensureProjectAccess(projectId, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    const assigneeId = req.body.assignee_id ? String(req.body.assignee_id) : undefined;
    const linkedTaskId = req.body.linked_task_id ? String(req.body.linked_task_id) : undefined;
    const sprintId = req.body.sprint_id ? String(req.body.sprint_id) : undefined;

    if (assigneeId) {
      const assignee = await User.findOne({
        where: {
          id: assigneeId,
          organization_id: project.owner.organization_id,
        },
        attributes: ["id"],
      });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: "Assignee must belong to the same organization",
        });
      }
    }

    if (linkedTaskId) {
      const linkedTask = await Task.findOne({
        where: {
          id: linkedTaskId,
          project_id: projectId,
        },
        attributes: ["id"],
      });
      if (!linkedTask) {
        return res.status(400).json({
          success: false,
          message: "Linked task must belong to the selected project",
        });
      }
    }

    let resolvedSprintName: string | null = req.body.sprint_name ? String(req.body.sprint_name).trim() : null;
    if (sprintId) {
      const sprint = await Sprint.findOne({
        where: {
          id: sprintId,
          project_id: projectId,
        },
        attributes: ["id", "name"],
      });
      if (!sprint) {
        return res.status(400).json({
          success: false,
          message: "Sprint must belong to the selected project",
        });
      }
      resolvedSprintName = sprint.name;
    }

    const { supportsSprintId, attributes } = await getDefectQueryMetadata();
    const defectPayload: Record<string, unknown> = {
      title: String(req.body.title || "").trim(),
      description: String(req.body.description || "").trim(),
      reproduction_steps: Array.isArray(req.body.reproduction_steps)
        ? req.body.reproduction_steps
        : [],
      severity: req.body.severity,
      priority: req.body.priority,
      status: "Open",
      project_id: projectId,
      linked_task_id: linkedTaskId,
      creator_id: userId,
      assignee_id: assigneeId,
      sprint_name: resolvedSprintName,
      linked_run: req.body.linked_run ? String(req.body.linked_run) : null,
      linked_case: req.body.linked_case ? String(req.body.linked_case) : null,
      environment: req.body.environment ? String(req.body.environment) : null,
    };

    if (supportsSprintId) {
      defectPayload.sprint_id = sprintId;
    }

    const defect = await Defect.create(defectPayload);

    if (linkedTaskId) {
      await Task.update(
        { defect_id: defect.id },
        {
          where: { id: linkedTaskId },
        },
      );

      await createTaskDefectAuditLog({
        taskId: linkedTaskId,
        userId,
        defect: {
          id: defect.id,
          reference_code: defect.reference_code,
          title: defect.title,
          status: "Open",
        },
        comment: buildDefectTraceComment(
          {
            reference_code: defect.reference_code,
            title: defect.title,
            status: "Open",
          },
          "was linked to this task.",
        ),
        newValues: {
          defect_id: defect.id,
          linked_task_id: linkedTaskId,
        },
      });
    }

    const created = await Defect.findByPk(defect.id, {
      attributes,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "full_name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "full_name", "email"] },
        ...(supportsSprintId
          ? [{ model: Sprint, as: "sprint", attributes: ["id", "name", "status"] }]
          : []),
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
        { model: Task, as: "created_task", attributes: ["id", "title"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Defect created successfully",
      data: serializeDefect(created?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create defect",
      error: (error as any)?.message,
    });
  }
};

export const updateDefectRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const defectId = String(req.params.id || "");

    const { supportsSprintId, attributes } = await getDefectQueryMetadata();
    const defect = await Defect.findByPk(defectId, {
      attributes,
      include: [
        {
          model: Project,
          as: "project",
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["id", "organization_id"],
            },
          ],
        },
      ],
    });

    if (!defect || !(await ensureProjectAccess(defect.project_id, userId, req.user?.role))) {
      return res.status(404).json({ success: false, message: "Defect not found or access denied" });
    }

    const updates: any = {};
    const fields = [
      "title",
      "description",
      "severity",
      "priority",
      "sprint_name",
      "linked_run",
      "linked_case",
      "environment",
      "assignee_id",
      "linked_task_id",
    ] as const;

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (supportsSprintId && req.body.sprint_id !== undefined) {
      updates.sprint_id = req.body.sprint_id;
    }

    if (req.body.reproduction_steps !== undefined) {
      updates.reproduction_steps = Array.isArray(req.body.reproduction_steps)
        ? req.body.reproduction_steps
        : [];
    }

    if (updates.assignee_id) {
      const assignee = await User.findOne({
        where: {
          id: updates.assignee_id,
          organization_id: defect.project.owner.organization_id,
        },
        attributes: ["id"],
      });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: "Assignee must belong to the same organization",
        });
      }
    }

    if (updates.linked_task_id) {
      const linkedTask = await Task.findOne({
        where: {
          id: updates.linked_task_id,
          project_id: defect.project_id,
        },
        attributes: ["id"],
      });
      if (!linkedTask) {
        return res.status(400).json({
          success: false,
          message: "Linked task must belong to the selected project",
        });
      }
    }

    if (updates.sprint_id) {
      const sprint = await Sprint.findOne({
        where: {
          id: updates.sprint_id,
          project_id: defect.project_id,
        },
        attributes: ["id", "name"],
      });
      if (!sprint) {
        return res.status(400).json({
          success: false,
          message: "Sprint must belong to the selected project",
        });
      }
      updates.sprint_name = sprint.name;
    } else if (req.body.sprint_id !== undefined) {
      updates.sprint_name = req.body.sprint_name ? String(req.body.sprint_name).trim() : null;
    }

    const previousLinkedTaskId = defect.linked_task_id;
    await defect.update(updates);

    if (updates.linked_task_id !== undefined) {
      if (updates.linked_task_id) {
        await Task.update({ defect_id: defect.id }, { where: { id: updates.linked_task_id } });
        await createTaskDefectAuditLog({
          taskId: String(updates.linked_task_id),
          userId,
          defect: {
            id: defect.id,
            reference_code: defect.reference_code,
            title: defect.title,
            status: defect.status,
          },
          comment: buildDefectTraceComment(
            {
              reference_code: defect.reference_code,
              title: defect.title,
              status: defect.status,
            },
            previousLinkedTaskId && previousLinkedTaskId !== updates.linked_task_id
              ? "was re-linked to this task."
              : "was linked to this task.",
          ),
          oldValues: previousLinkedTaskId
            ? {
                linked_task_id: previousLinkedTaskId,
              }
            : undefined,
          newValues: {
            linked_task_id: updates.linked_task_id,
            defect_id: defect.id,
          },
        });
      }
      if (previousLinkedTaskId && previousLinkedTaskId !== updates.linked_task_id) {
        await Task.update({ defect_id: null }, { where: { id: previousLinkedTaskId } });
        await createTaskDefectAuditLog({
          taskId: previousLinkedTaskId,
          userId,
          defect: {
            id: defect.id,
            reference_code: defect.reference_code,
            title: defect.title,
            status: defect.status,
          },
          comment: buildDefectTraceComment(
            {
              reference_code: defect.reference_code,
              title: defect.title,
              status: defect.status,
            },
            "was unlinked from this task.",
          ),
          oldValues: {
            linked_task_id: previousLinkedTaskId,
            defect_id: defect.id,
          },
          newValues: {
            linked_task_id: updates.linked_task_id ?? null,
            defect_id: null,
          },
        });
      }
    }

    const updated = await Defect.findByPk(defect.id, {
      attributes,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "full_name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "full_name", "email"] },
        ...(supportsSprintId
          ? [{ model: Sprint, as: "sprint", attributes: ["id", "name", "status"] }]
          : []),
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
        { model: Task, as: "created_task", attributes: ["id", "title"] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Defect updated successfully",
      data: serializeDefect(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update defect",
      error: (error as any)?.message,
    });
  }
};

export const reviewDefectRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const defectId = String(req.params.id || "");

    const { supportsSprintId, attributes } = await getDefectQueryMetadata();
    const defect = await Defect.findByPk(defectId, {
      attributes,
      include: [
        {
          model: Project,
          as: "project",
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["id", "organization_id"],
            },
          ],
        },
        { model: User, as: "creator", attributes: ["id", "full_name", "email"] },
      ],
    });

    if (!defect || !(await ensureProjectAccess(defect.project_id, userId, req.user?.role))) {
      return res.status(404).json({ success: false, message: "Defect not found or access denied" });
    }

    const action = String(req.body.action || "").toLowerCase();
    const reason = String(req.body.reason || "").trim();

    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({
        success: false,
        message: "Action must be approve or reject",
      });
    }

    if (action === "reject" && !reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required when rejecting a defect",
      });
    }

    if (action === "approve") {
      let createdTaskId = defect.created_task_id;
      let createdTaskTitle = defect.created_task?.title || null;

      if (!createdTaskId) {
        const createdTask = await createTask({
          title: `Fix defect: ${defect.title}`,
          description: [
            `Auto-created from defect ${defect.reference_code}.`,
            "",
            defect.description,
            "",
            "Reproduction steps:",
            ...(Array.isArray(defect.reproduction_steps)
              ? defect.reproduction_steps.map((step, index) => `${index + 1}. ${step}`)
              : []),
          ].join("\n"),
          status: TaskStatus.TODO,
          priority: mapDefectPriorityToTaskPriority(defect.priority) as TaskPriority,
          project_id: defect.project_id,
          assignee_id: defect.assignee_id,
          defect_id: defect.id,
          creator_id: defect.creator_id,
        });

        createdTaskId = createdTask?.id;
        createdTaskTitle = createdTask?.title || createdTaskTitle;
      }

      await defect.update({
        status: "Approved",
        approved_at: new Date(),
        approved_by: userId,
        rejected_at: null,
        rejected_by: null,
        rejection_reason: null,
        created_task_id: createdTaskId,
        linked_task_id: defect.linked_task_id || createdTaskId,
      });

      await createTaskDefectAuditLog({
        taskId: createdTaskId,
        userId,
        defect: {
          id: defect.id,
          reference_code: defect.reference_code,
          title: defect.title,
          status: "Approved",
        },
        comment: buildDefectTraceComment(
          {
            reference_code: defect.reference_code,
            title: defect.title,
            status: "Approved",
          },
          defect.created_task_id
            ? "was approved and remains connected to this task."
            : `was approved and created follow-up task${createdTaskTitle ? ` ${createdTaskTitle}` : ""}.`,
        ),
        oldValues: {
          defect_status: defect.status,
        },
        newValues: {
          defect_status: "Approved",
          defect_id: defect.id,
          created_task_id: createdTaskId,
        },
      });
    } else {
      await defect.update({
        status: "Rejected",
        rejection_reason: reason,
        rejected_at: new Date(),
        rejected_by: userId,
      });
    }

    const reviewed = await Defect.findByPk(defect.id, {
      attributes,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "full_name", "email"] },
        { model: User, as: "assignee", attributes: ["id", "full_name", "email"] },
        ...(supportsSprintId
          ? [{ model: Sprint, as: "sprint", attributes: ["id", "name", "status"] }]
          : []),
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
        { model: Task, as: "created_task", attributes: ["id", "title"] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: `Defect ${action}d successfully`,
      data: serializeDefect(reviewed?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to review defect",
      error: (error as any)?.message,
    });
  }
};
