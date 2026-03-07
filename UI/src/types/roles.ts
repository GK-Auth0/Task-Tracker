export type WorkspaceRole = "Admin" | "Member" | "Viewer";

const ROLE_ORDER: Record<WorkspaceRole, number> = {
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
  return ROLE_ORDER[normalized] >= ROLE_ORDER[requiredRole];
};

export const canManageWorkspaceContent = (role: unknown) =>
  hasMinimumWorkspaceRole(role, "Member");

export const isWorkspaceAdmin = (role: unknown) =>
  normalizeWorkspaceRole(role) === "Admin";
