import axios from "axios";
import { AI_BASE_URL } from "../config/api";

const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface AiTaskSuggestion {
  priority: "Low" | "Medium" | "High";
  due_date: string;
  estimated_hours: number;
  checklist: string[];
  reason: string;
}

export interface AiPlanTask {
  title: string;
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  estimated_hours?: number;
  status?: string;
}

export interface AiDayPlan {
  focus_hours: number;
  planned_hours: number;
  today_plan: AiPlanTask[];
  backlog: AiPlanTask[];
  tip: string;
}

export interface AiProjectInsights {
  summary: string;
  risk_level: "Low" | "Medium" | "High";
  signals: string[];
  recommendations: string[];
}

export interface AiServiceHealth {
  ok: boolean;
  service: string;
  features: string[];
}

export interface AiEndpointMetric {
  count: number;
  errors: number;
  avg_ms: number;
  last_status: number;
}

export interface AiServiceMetrics {
  started_at: string;
  uptime_seconds: number;
  requests_total: number;
  errors_total: number;
  endpoints: Record<string, AiEndpointMetric>;
}

export const aiAssistantAPI = {
  suggestTask: async (
    title: string,
    description: string,
  ): Promise<AiTaskSuggestion> => {
    const response = await aiApi.post("/suggest-task", { title, description });
    return response.data.data;
  },

  planDay: async (
    tasks: AiPlanTask[],
    focusHours: number = 6,
  ): Promise<AiDayPlan> => {
    const response = await aiApi.post("/plan-day", {
      tasks,
      focus_hours: focusHours,
    });
    return response.data.data;
  },

  projectInsights: async (tasks: AiPlanTask[]): Promise<AiProjectInsights> => {
    const response = await aiApi.post("/project-insights", { tasks });
    return response.data.data;
  },

  getHealth: async (): Promise<AiServiceHealth> => {
    const response = await aiApi.get("/health");
    return response.data;
  },

  getMetrics: async (): Promise<AiServiceMetrics> => {
    const response = await aiApi.get("/metrics");
    return response.data.metrics;
  },
};

export default aiAssistantAPI;
