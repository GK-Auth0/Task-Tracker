import api from "./auth";
import type { Sprint, SprintInsightsResponse } from "../types/sprint";

export const sprintsAPI = {
  getSprints: async (params?: {
    project_id?: string;
    status?: "Planning" | "Active" | "Completed";
  }): Promise<{ success: boolean; data: Sprint[] }> => {
    const response = await api.get("/api/sprints", { params });
    return response.data;
  },

  createSprint: async (data: {
    name?: string;
    goal?: string;
    release?: string;
    squad?: string;
    project_id: string;
    owner_id?: string;
    capacity?: number;
    start_date?: string;
    end_date?: string;
    status?: "Planning" | "Active" | "Completed";
    task_ids?: string[];
  }): Promise<{ success: boolean; data: Sprint; message: string }> => {
    const response = await api.post("/api/sprints", data);
    return response.data;
  },

  getSprint: async (id: string): Promise<{ success: boolean; data: Sprint }> => {
    const response = await api.get(`/api/sprints/${id}`);
    return response.data;
  },

  getSprintInsights: async (
    id: string,
  ): Promise<{ success: boolean; data: SprintInsightsResponse }> => {
    const response = await api.get(`/api/sprints/${id}/insights`);
    return response.data;
  },

  updateSprint: async (
    id: string,
    data: Partial<{
      name: string;
      goal: string;
      release: string;
      squad: string;
      owner_id: string;
      capacity: number;
      start_date: string;
      end_date: string;
      status: "Planning" | "Active" | "Completed";
    }>,
  ): Promise<{ success: boolean; data: Sprint; message: string }> => {
    const response = await api.patch(`/api/sprints/${id}`, data);
    return response.data;
  },

  startSprint: async (
    id: string,
    data?: { start_date?: string; end_date?: string },
  ): Promise<{ success: boolean; data: Sprint; message: string }> => {
    const response = await api.post(`/api/sprints/${id}/start`, data || {});
    return response.data;
  },

  completeSprint: async (
    id: string,
    data?: { destination_sprint_id?: string; move_open_tasks_to_backlog?: boolean; end_date?: string },
  ): Promise<{ success: boolean; data: Sprint; message: string }> => {
    const response = await api.post(`/api/sprints/${id}/complete`, data || {});
    return response.data;
  },

  addTasksToSprint: async (
    id: string,
    task_ids: string[],
  ): Promise<{ success: boolean; data: Sprint; message: string }> => {
    const response = await api.post(`/api/sprints/${id}/tasks`, { task_ids });
    return response.data;
  },

  removeTaskFromSprint: async (
    id: string,
    taskId: string,
  ): Promise<{ success: boolean; data: Sprint; message: string }> => {
    const response = await api.delete(`/api/sprints/${id}/tasks/${taskId}`);
    return response.data;
  },
};
