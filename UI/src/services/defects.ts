import api from "./auth";
import type { Defect } from "../types/defect";

export const defectsAPI = {
  getDefects: async (params?: {
    project_id?: string;
    status?: string;
    sprint_id?: string;
  }): Promise<{ success: boolean; data: Defect[] }> => {
    const response = await api.get("/api/defects", { params });
    return response.data;
  },

  createDefect: async (data: {
    title: string;
    description: string;
    reproduction_steps: string[];
    severity: Defect["severity"];
    priority: Defect["priority"];
    project_id: string;
    assignee_id?: string;
    linked_task_id?: string;
    sprint_id?: string;
    sprint_name?: string;
    linked_run?: string;
    linked_case?: string;
    environment?: string;
  }): Promise<{ success: boolean; data: Defect; message: string }> => {
    const response = await api.post("/api/defects", data);
    return response.data;
  },

  updateDefect: async (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      reproduction_steps: string[];
      severity: Defect["severity"];
      priority: Defect["priority"];
      assignee_id?: string;
      linked_task_id?: string;
      sprint_id?: string;
      sprint_name?: string;
      linked_run?: string;
      linked_case?: string;
      environment?: string;
    }>,
  ): Promise<{ success: boolean; data: Defect; message: string }> => {
    const response = await api.patch(`/api/defects/${id}`, data);
    return response.data;
  },

  reviewDefect: async (
    id: string,
    action: "approve" | "reject",
    reason?: string,
  ): Promise<{ success: boolean; data: Defect; message: string }> => {
    const response = await api.patch(`/api/defects/${id}/review`, {
      action,
      reason,
    });
    return response.data;
  },
};
