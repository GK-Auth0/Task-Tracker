import api from "./auth";
import type { TestAutomation, TestCasePriority, TestCaseRecord, TestCaseStatus } from "../types/testCase";

export interface TestCaseFormProjectOption {
  id: string;
  name: string;
}

export interface TestCaseFormTaskOption {
  id: string;
  title: string;
  project: {
    id: string;
    name: string;
  } | null;
}

export interface TestCaseFormSprintOption {
  id: string;
  name: string;
  project_id: string;
  status: "Planning" | "Active" | "Completed";
  start_date?: string | null;
  end_date?: string | null;
  project: {
    id: string;
    name: string;
  } | null;
}

export interface TestCaseModuleOption {
  id: string;
  name: string;
  project_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface TestCaseSuiteOption {
  id: string;
  name: string;
  project_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface TestCaseExecutionAttachment {
  url: string;
  name: string;
  type: string;
}

export const testCasesAPI = {
  getTestCases: async (params?: {
    project_id?: string;
    status?: TestCaseStatus;
    automation?: TestAutomation;
    sprint_id?: string;
    linked_task_id?: string;
  }): Promise<{ success: boolean; data: TestCaseRecord[] }> => {
    const response = await api.get("/api/test-cases", { params });
    return response.data;
  },

  getFormOptions: async (params?: {
    project_id?: string;
  }): Promise<{
    success: boolean;
    data: {
      projects: TestCaseFormProjectOption[];
      tasks: TestCaseFormTaskOption[];
      sprints: TestCaseFormSprintOption[];
      suites: string[];
      modules: string[];
    };
  }> => {
    const response = await api.get("/api/test-cases/form-options", { params });
    return response.data;
  },

  createTestCase: async (data: {
    title: string;
    project_id: string;
    linked_task_id?: string;
    suite: string;
    module: string;
    sprint_id?: string;
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

  updateTestCase: async (
    id: string,
    data: {
      title: string;
      project_id: string;
      linked_task_id?: string;
      suite: string;
      module: string;
      sprint_id?: string;
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
    },
  ): Promise<{ success: boolean; data: TestCaseRecord; message: string }> => {
    const response = await api.put(`/api/test-cases/${id}`, data);
    return response.data;
  },

  addExecution: async (
    id: string,
    data: {
      status: "Passed" | "Failed" | "Blocked";
      cycle?: string;
      note?: string;
      actual_behavior?: string;
      attachments?: TestCaseExecutionAttachment[];
    },
  ): Promise<{ success: boolean; data: TestCaseRecord; message: string }> => {
    const response = await api.post(`/api/test-cases/${id}/executions`, data);
    return response.data;
  },

  uploadExecutionAttachment: async (
    id: string,
    file: File,
  ): Promise<{ success: boolean; data: TestCaseExecutionAttachment }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/test-cases/${id}/execution-attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export const testCaseModulesAPI = {
  getModules: async (params?: {
    project_id?: string;
  }): Promise<{ success: boolean; data: TestCaseModuleOption[] }> => {
    const response = await api.get("/api/test-case-modules", { params });
    return response.data;
  },

  createModule: async (data: {
    name: string;
    project_id: string;
  }): Promise<{ success: boolean; data: TestCaseModuleOption; message: string }> => {
    const response = await api.post("/api/test-case-modules", data);
    return response.data;
  },
};

export const testCaseSuitesAPI = {
  getSuites: async (params?: {
    project_id?: string;
  }): Promise<{ success: boolean; data: TestCaseSuiteOption[] }> => {
    const response = await api.get("/api/test-case-suites", { params });
    return response.data;
  },

  createSuite: async (data: {
    name: string;
    project_id: string;
  }): Promise<{ success: boolean; data: TestCaseSuiteOption; message: string }> => {
    const response = await api.post("/api/test-case-suites", data);
    return response.data;
  },
};
