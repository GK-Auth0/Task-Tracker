import { AuditLog, Project, Task, User } from "../models";
import type { AuditLogData } from "../types/audit";
import { Op } from "sequelize";

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await AuditLog.create(data as any);
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

export const getAuditLogs = async (
  organizationId: string,
  entity_type?: "task" | "project",
  entity_id?: string,
  limit: number = 50,
  from?: Date,
  to?: Date,
) => {
  const projectWhere: Record<string, unknown> = {};
  if (entity_type === "project") {
    projectWhere.id = entity_id;
  }

  const projects = await Project.findAll({
    attributes: ["id"],
    where: projectWhere,
    include: [
      {
        model: User,
        as: "owner",
        attributes: [],
        required: true,
        where: {
          organization_id: organizationId,
        },
      },
    ],
  });

  const accessibleProjectIds = projects.map((project) => String(project.id));
  const accessibleProjectIdSet = new Set(accessibleProjectIds);

  const taskWhere: Record<string, unknown> = {};
  if (entity_type === "task") {
    taskWhere.id = entity_id;
  }
  if (entity_type !== "project") {
    taskWhere.project_id = {
      [Op.in]: accessibleProjectIds.length ? accessibleProjectIds : ["00000000-0000-0000-0000-000000000000"],
    };
  }

  const tasks = await Task.findAll({
    attributes: ["id", "project_id"],
    where: taskWhere,
  });

  const accessibleTaskIds = tasks
    .filter((task) => accessibleProjectIdSet.has(String(task.project_id)))
    .map((task) => String(task.id));

  const scopedConditions = [];
  if (!entity_type || entity_type === "project") {
    scopedConditions.push({
      entity_type: "project",
      entity_id: {
        [Op.in]: accessibleProjectIds.length ? accessibleProjectIds : ["00000000-0000-0000-0000-000000000000"],
      },
    });
  }
  if (!entity_type || entity_type === "task") {
    scopedConditions.push({
      entity_type: "task",
      entity_id: {
        [Op.in]: accessibleTaskIds.length ? accessibleTaskIds : ["00000000-0000-0000-0000-000000000000"],
      },
    });
  }

  const where: any = {
    [Op.or]: scopedConditions,
  };
  if (from || to) {
    where.created_at = {
      ...(from ? { [Op.gte]: from } : {}),
      ...(to ? { [Op.lte]: to } : {}),
    };
  }

  return await AuditLog.findAll({
    where,
    include: [{ association: "user", attributes: ["id", "first_name", "last_name", "email"] }],
    order: [["created_at", "DESC"]],
    limit,
  });
};
