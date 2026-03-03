import { AuditLog } from "../models";
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
  entity_type?: "task" | "project",
  entity_id?: string,
  limit: number = 50,
  from?: Date,
  to?: Date,
) => {
  const where: any = {};
  if (entity_type) where.entity_type = entity_type;
  if (entity_id) where.entity_id = entity_id;
  if (from || to) {
    where.created_at = {
      ...(from ? { [Op.gte]: from } : {}),
      ...(to ? { [Op.lte]: to } : {}),
    };
  }

  return await AuditLog.findAll({
    where,
    include: [{ association: "user", attributes: ["id", "full_name", "email"] }],
    order: [["created_at", "DESC"]],
    limit,
  });
};
