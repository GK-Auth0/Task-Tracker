import { NextFunction, Request, Response } from "express";

export type WorkspaceRole = "Admin" | "Member" | "Viewer";

const WORKSPACE_ROLE_ORDER: Record<WorkspaceRole, number> = {
  Viewer: 1,
  Member: 2,
  Admin: 3,
};

export const normalizeWorkspaceRole = (
  role: unknown,
): WorkspaceRole | null => {
  const value = String(role || "").trim().toLowerCase();
  if (value === "admin") return "Admin";
  if (value === "member") return "Member";
  if (value === "viewer") return "Viewer";
  return null;
};

export const hasMinimumWorkspaceRole = (
  actualRole: unknown,
  requiredRole: WorkspaceRole,
) => {
  const normalized = normalizeWorkspaceRole(actualRole);
  if (!normalized) return false;
  return WORKSPACE_ROLE_ORDER[normalized] >= WORKSPACE_ROLE_ORDER[requiredRole];
};

export const requireWorkspaceRole = (requiredRole: WorkspaceRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: { role?: string } }).user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "UNAUTHORIZED",
      });
    }

    if (!hasMinimumWorkspaceRole(user.role, requiredRole)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient role. ${requiredRole} or higher required.`,
        error: "FORBIDDEN",
      });
    }

    return next();
  };
};

export const isWorkspaceAdmin = (role: unknown) =>
  normalizeWorkspaceRole(role) === "Admin";
