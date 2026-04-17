import axios from "axios";
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsResponse,
  ProjectResponse,
  ProjectConfidentialAccessConfig,
  ProjectConfidentialAccessProjectSummary,
} from "../types/project";

import { API_BASE_URL } from "../config/api";
import { applyAuthInterceptors } from "./auth";

const api = applyAuthInterceptors(
  axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  }),
);

export const projectService = {
  // Get all projects
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ProjectsResponse> => {
    const response = await api.get("/projects", { params });
    return response.data;
  },

  // Get project by ID
  getProject: async (id: string): Promise<ProjectResponse> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (
    data: CreateProjectRequest,
  ): Promise<ProjectResponse> => {
    const response = await api.post("/projects", data);
    return response.data;
  },

  // Update project service to accept string UUID instead of number
  updateProject: async (
    id: string,
    data: UpdateProjectRequest,
  ): Promise<ProjectResponse> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Add member to project
  addMember: async (
    projectId: string,
    userId: string,
    role: "owner" | "admin" | "member" | "viewer" = "member",
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await api.post(`/projects/${projectId}/members`, { userId, role });
    return response.data;
  },

  // Remove member from project
  removeMember: async (
    projectId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (
    projectId: string,
    userId: string,
    role: "owner" | "admin" | "member" | "viewer",
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await api.put(`/projects/${projectId}/members/${userId}`, { role });
    return response.data;
  },

  getProjectUsers: async (
    search?: string,
    signal?: AbortSignal,
  ): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      first_name?: string;
      last_name?: string;
      full_name?: string;
      email: string;
      role: string;
      avatar_url?: string;
    }>;
  }> => {
    const response = await api.get("/projects/users", {
      params: { search },
      signal,
    });
    return response.data;
  },

  // Get project statistics
  getProjectStats: async (
    id: number,
  ): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    progress: number;
  }> => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  },

  // Get project files
  getProjectFiles: async (
    id: string,
  ): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(`/projects/${id}/files`);
    return response.data;
  },

  getProjectRoadmap: async (
    id: string,
  ): Promise<{ success: boolean; data: any[]; message?: string }> => {
    const response = await api.get(`/projects/${id}/roadmap`);
    return response.data;
  },

  requestConfidentialAccess: async (
    id: string,
    reason?: string,
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.post(`/projects/${id}/confidential-access/request`, {
      reason,
    });
    return response.data;
  },

  getConfidentialAccessRequests: async (
    id: string,
  ): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(`/projects/${id}/confidential-access/requests`);
    return response.data;
  },

  reviewConfidentialAccessRequest: async (
    projectId: string,
    requestId: string,
    action: "approve" | "reject",
    decisionNote?: string,
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.patch(
      `/projects/${projectId}/confidential-access/requests/${requestId}`,
      {
        action,
        decision_note: decisionNote,
      },
    );
    return response.data;
  },

  getConfidentialAccessConfig: async (
    id: string,
  ): Promise<{ success: boolean; data: ProjectConfidentialAccessConfig }> => {
    const response = await api.get(`/projects/${id}/confidential-access/config`);
    return response.data;
  },

  updateConfidentialAccessConfig: async (
    id: string,
    data: {
      access_scope: "specific_users" | "organization";
      allowed_user_ids: string[];
    },
  ): Promise<{
    success: boolean;
    data: ProjectConfidentialAccessConfig;
    message?: string;
  }> => {
    const response = await api.patch(`/projects/${id}/confidential-access/config`, data);
    return response.data;
  },

  getConfidentialAccessProjects: async (): Promise<{
    success: boolean;
    data: ProjectConfidentialAccessProjectSummary[];
  }> => {
    const response = await api.get("/projects/confidential-access/projects");
    return response.data;
  },
};

export default projectService;
