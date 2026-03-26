import axios from "axios";
import { AI_BASE_URL } from "../config/api";

const aiApiKey = String(import.meta.env.VITE_AI_API_KEY || "").trim();

const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    ...(aiApiKey ? { "X-API-Key": aiApiKey } : {}),
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

export interface AiAutoInsightTask {
  title: string;
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  status?: string;
  estimated_hours?: number;
}

export interface AiAutoInsightProject {
  id?: string;
  name: string;
  status?: string;
  priority?: string;
}

export interface AiAutoInsights {
  summary: string;
  risk_level: "Low" | "Medium" | "High";
  insights: string[];
  recommendations: string[];
  priority_tasks: Array<{
    title: string;
    priority: string;
    due_date?: string;
  }>;
  snapshot_lines: string[];
  quick_actions: string[];
}

export interface AiWorkloadForecast {
  window_days: number;
  due_task_count: number;
  estimated_hours: number;
  high_priority_due_count: number;
  pressure: "Low" | "Medium" | "High";
  recommendations: string[];
}

export interface AiChatContextResult {
  reply: string;
  context_snapshot: string;
  quick_actions: string[];
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

  autoInsights: async (
    tasks: AiAutoInsightTask[],
    projects: AiAutoInsightProject[],
    routeContext: string = "/dashboard",
  ): Promise<AiAutoInsights> => {
    const response = await aiApi.post("/auto-insights", {
      tasks,
      projects,
      route_context: routeContext,
    });
    return response.data.data;
  },

  workloadForecast: async (
    tasks: AiAutoInsightTask[],
    days: number = 7,
  ): Promise<AiWorkloadForecast> => {
    const response = await aiApi.post("/workload-forecast", { tasks, days });
    return response.data.data;
  },

  chatContext: async (
    message: string,
    tasks: AiAutoInsightTask[],
    projects: AiAutoInsightProject[],
    routeContext: string = "/dashboard",
    responseMode: "concise" | "balanced" | "detailed" = "balanced",
  ): Promise<AiChatContextResult> => {
    const response = await aiApi.post("/chat-context", {
      message,
      tasks,
      projects,
      route_context: routeContext,
      response_mode: responseMode,
    });
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
