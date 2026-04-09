export type TestPlanStatus = "Draft" | "Active" | "Completed";
export type TestRunStatus = "Planned" | "In Progress" | "Completed" | "Blocked";

export interface TestPlanRecord {
  id: string;
  reference_code: string;
  name: string;
  sprint_id?: string | null;
  sprint_name?: string | null;
  release_name?: string | null;
  status: TestPlanStatus;
  suite_names: string[];
  project_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  case_count: number;
  run_count: number;
  project: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  sprint: {
    id: string;
    name: string;
    status: "Planning" | "Active" | "Completed";
  } | null;
}

export interface TestRunRecord {
  id: string;
  reference_code: string;
  name: string;
  environment: string;
  status: TestRunStatus;
  notes?: string | null;
  plan_id: string;
  project_id: string;
  owner_id: string;
  sprint_id?: string | null;
  created_at: string;
  updated_at: string;
  total_cases: number;
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
  pass_rate: number;
  plan: {
    id: string;
    reference_code: string;
    name: string;
    status: TestPlanStatus;
    suite_names: string[];
  } | null;
  sprint: {
    id: string;
    name: string;
    status: "Planning" | "Active" | "Completed";
  } | null;
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

export interface TraceabilityRow {
  id: string;
  requirement: string;
  linkedStory: string;
  linkedCases: string[];
  coverage: "Covered" | "At Risk" | "Draft" | "Gap";
  latestRun: string;
}

export interface TestReportsSummary {
  summary: {
    total_cases: number;
    automated_cases: number;
    linked_cases: number;
    plan_count: number;
    run_count: number;
    pass_rate: number;
    open_defects: number;
    resolved_defects: number;
  };
  latest_run_health: Array<{
    id: string;
    name: string;
    environment: string;
    status: TestRunStatus;
    updated_at: string;
    pass_rate: number;
  }>;
}
