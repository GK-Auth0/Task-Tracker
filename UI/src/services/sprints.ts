import api from "./auth";
import type { Sprint } from "../types/sprint";

export const sprintsAPI = {
  getSprints: async (params?: {
    project_id?: string;
  }): Promise<{ success: boolean; data: Sprint[] }> => {
    const response = await api.get("/api/sprints", { params });
    return response.data;
  },

  createSprint: async (data: {
    name: string;
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
};
