import { AuditLog } from "../models";

interface AuditLogData {
  entity_type: "task" | "project";
  entity_id: string;
  action: "created" | "updated" | "deleted" | "status_changed" | "assigned" | "unassigned";
  user_id: string;
  old_values?: object;
  new_values?: object;
  changes?: object;
}

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