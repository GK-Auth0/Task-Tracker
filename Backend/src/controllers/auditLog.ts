import { Request, Response } from "express";
import { getAuditLogs } from "../services/auditService";
import { parseBoundedInt, parseIsoDate } from "../helpers/query";

export const getEntityAuditLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID required",
        error: "UNAUTHORIZED",
      });
    }

    const entity_type = req.query.entity_type as "task" | "project" | undefined;
    const entity_id = (req.query.entity_id as string) || (req.params.id as string);
    const limit = parseBoundedInt(req.query.limit, 50, 1, 200);
    const from = parseIsoDate(req.query.from);
    const to = parseIsoDate(req.query.to);

    const logs = await getAuditLogs(entity_type, entity_id, limit, from, to);

    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to get audit logs",
      error: (error as any).message,
    });
  }
};
