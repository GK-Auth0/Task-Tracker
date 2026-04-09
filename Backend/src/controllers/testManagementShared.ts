import { Request } from "express";
import { Project, ProjectMember, User } from "../models";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

export const isWorkspaceAdmin = (role: unknown) =>
  String(role || "").trim().toLowerCase() === "admin";

export const getRequesterOrganizationId = async (userId: string) => {
  const requester = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  return requester?.organization_id || null;
};

export const getAccessibleProjects = async (userId: string) => {
  const organizationId = await getRequesterOrganizationId(userId);
  if (!organizationId) return [];

  return Project.findAll({
    attributes: ["id", "name", "owner_id"],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
    order: [["name", "ASC"]],
  });
};

export const ensureProjectAccess = async (projectId: string, userId: string, role?: string) => {
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
    where: {
      project_id: projectId,
      user_id: userId,
    },
    attributes: ["id"],
  });

  return membership ? project : null;
};

const parseExecutionTime = (value: unknown) => {
  const parsed = new Date(String(value || "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getLatestCaseExecution = (testCase: any) => {
  const history = Array.isArray(testCase.execution_history) ? testCase.execution_history : [];
  const latestHistory = history.reduce((latest: any, entry: any) => {
    if (!latest) return entry;
    return parseExecutionTime(entry?.executedAt) >= parseExecutionTime(latest?.executedAt)
      ? entry
      : latest;
  }, null);

  if (latestHistory?.status) {
    return {
      status: latestHistory.status,
      cycle: latestHistory.cycle || "Latest run",
      executedAt: latestHistory.executedAt || null,
      note: latestHistory.note || "",
    };
  }

  if (["Passed", "Failed", "Blocked"].includes(String(testCase?.status || ""))) {
    return {
      status: testCase.status,
      cycle: testCase.sprint?.name || testCase.sprint_name || "Current cycle",
      executedAt: testCase.updated_at || null,
      note: "",
    };
  }

  return {
    status: "Pending",
    cycle: "Not executed",
    executedAt: testCase.updated_at || null,
    note: "",
  };
};
