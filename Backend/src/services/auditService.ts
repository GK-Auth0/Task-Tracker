import { AuditLog } from "../models";
import type { AuditLogData } from "../types/audit";

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
  limit: number = 50
) => {
  const where: any = {};
  if (entity_type) where.entity_type = entity_type;
  if (entity_id) where.entity_id = entity_id;

  return await AuditLog.findAll({
    where,
    include: [{ association: "user", attributes: ["id", "full_name", "email"] }],
    order: [["created_at", "DESC"]],
    limit,
  });
};