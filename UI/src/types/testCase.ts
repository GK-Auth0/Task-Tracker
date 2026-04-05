export type TestCaseStatus = "Draft" | "Ready" | "Blocked" | "Passed" | "Failed";
export type TestCasePriority = "Critical" | "High" | "Medium" | "Low";
export type TestAutomation = "Manual" | "Automated" | "Candidate";

export interface TestStep {
  id: number;
  action: string;
  expected: string;
}

export interface ExecutionEntry {
  id: string;
  cycle: string;
  status: "Passed" | "Failed" | "Blocked";
  tester: string;
  executedAt: string;
  note: string;
}

export interface LinkedItem {
  id: string;
  type: "Story" | "Bug" | "Requirement";
  title: string;
}

export interface TestCaseRecord {
  id: string;
  reference_code: string;
  title: string;
  suite: string;
  module: string;
  sprint_name?: string | null;
  priority: TestCasePriority;
  status: TestCaseStatus;
  automation: TestAutomation;
  tags: string[];
  preconditions: string[];
  steps: TestStep[];
  linked_items: LinkedItem[];
  execution_history: ExecutionEntry[];
  project_id: string;
  linked_task_id?: string | null;
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
  linked_task: {
    id: string;
    title: string;
  } | null;
}
