export interface Defect {
  id: string;
  reference_code: string;
  title: string;
  description: string;
  reproduction_steps: string[];
  severity: "Critical" | "High" | "Medium" | "Low";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Approved" | "Rejected" | "In Progress" | "Resolved";
  project_id: string;
  sprint_id?: string | null;
  sprint_name?: string | null;
  linked_run?: string | null;
  linked_case?: string | null;
  environment?: string | null;
  rejection_reason?: string | null;
  creator_id: string;
  assignee_id?: string | null;
  linked_task_id?: string | null;
  created_task_id?: string | null;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  creator: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  assignee: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  sprint: {
    id: string;
    name: string;
    status: "Planning" | "Active" | "Completed";
  } | null;
  linked_task: {
    id: string;
    title: string;
  } | null;
  created_task: {
    id: string;
    title: string;
  } | null;
}
