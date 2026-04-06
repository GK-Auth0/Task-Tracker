import api from "./auth";
import type {
  TestPlanRecord,
  TestReportsSummary,
  TestRunRecord,
  TraceabilityRow,
} from "../types/testManagement";

export const testPlansAPI = {
  getPlans: async (params?: { project_id?: string }) => {
    const response = await api.get<{ success: boolean; data: TestPlanRecord[] }>(
      "/api/test-plans",
      { params },
    );
    return response.data;
  },

  createPlan: async (data: {
    name: string;
    project_id: string;
    sprint_name?: string;
    release_name?: string;
    status?: "Draft" | "Active" | "Completed";
    suite_names?: string[];
  }) => {
    const response = await api.post<{
      success: boolean;
      data: TestPlanRecord;
      message: string;
    }>("/api/test-plans", data);
    return response.data;
  },
};

export const testRunsAPI = {
  getRuns: async (params?: { project_id?: string; plan_id?: string }) => {
    const response = await api.get<{ success: boolean; data: TestRunRecord[] }>(
      "/api/test-runs",
      { params },
    );
    return response.data;
  },

  createRun: async (data: {
    name: string;
    plan_id: string;
    environment: string;
    status?: "Planned" | "In Progress" | "Completed" | "Blocked";
    notes?: string;
  }) => {
    const response = await api.post<{
      success: boolean;
      data: TestRunRecord;
      message: string;
    }>("/api/test-runs", data);
    return response.data;
  },
};

export const testInsightsAPI = {
  getTraceability: async (params?: { project_id?: string }) => {
    const response = await api.get<{ success: boolean; data: TraceabilityRow[] }>(
      "/api/test-insights/traceability",
      { params },
    );
    return response.data;
  },

  getReports: async () => {
    const response = await api.get<{ success: boolean; data: TestReportsSummary }>(
      "/api/test-insights/reports",
    );
    return response.data;
  },
};
