import api from "./auth";
import type { TestAutomation, TestCasePriority, TestCaseRecord, TestCaseStatus } from "../types/testCase";

export const testCasesAPI = {
  getTestCases: async (params?: {
    project_id?: string;
    status?: TestCaseStatus;
    automation?: TestAutomation;
  }): Promise<{ success: boolean; data: TestCaseRecord[] }> => {
    const response = await api.get("/api/test-cases", { params });
    return response.data;
  },

  createTestCase: async (data: {
    title: string;
    project_id: string;
    linked_task_id?: string;
    suite: string;
    module: string;
    sprint_name?: string;
    priority: TestCasePriority;
    status?: TestCaseStatus;
    automation: TestAutomation;
    tags: string[];
    preconditions: string[];
    steps: Array<{ id: number; action: string; expected: string }>;
    linked_items: Array<{
      id: string;
      type: "Story" | "Bug" | "Requirement";
      title: string;
    }>;
    execution_history?: Array<{
      id: string;
      cycle: string;
      status: "Passed" | "Failed" | "Blocked";
      tester: string;
      executedAt: string;
      note: string;
    }>;
  }): Promise<{ success: boolean; data: TestCaseRecord; message: string }> => {
    const response = await api.post("/api/test-cases", data);
    return response.data;
  },
};
