export interface Sprint {
  id: string;
  name: string;
  goal?: string | null;
  release?: string | null;
  squad?: string | null;
  project_id: string;
  owner_id: string;
  capacity?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "Planning" | "Active" | "Completed";
  created_at: string;
  updated_at: string;
  tasks_count: number;
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

export interface SprintTaskSummary {
  id: string;
  title: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  issue_type?: "Story" | "Task" | "Bug";
  due_date?: string | null;
  updated_at?: string;
  project: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface SprintInsights {
  summary: {
    projects: number;
    tasks_total: number;
    tasks_todo: number;
    tasks_in_progress: number;
    tasks_done: number;
    overdue_tasks: number;
    unassigned_tasks: number;
    open_defects: number;
    failed_test_cases: number;
  };
  trend: Array<{
    date: string;
    added: number;
    completed: number;
    in_progress: number;
  }>;
  project_breakdown: Array<{
    sprint_id: string;
    project: {
      id: string;
      name: string;
    } | null;
    owner: {
      id: string;
      full_name: string;
      email: string;
    } | null;
    release: string | null;
    status: "Planning" | "Active" | "Completed";
    capacity: number | null;
    task_status: {
      todo: number;
      in_progress: number;
      done: number;
    };
    overdue_tasks: number;
    open_defects: number;
    failed_test_cases: number;
  }>;
  lagging_people: Array<{
    id: string;
    full_name: string;
    email: string;
    overdue_tasks: number;
    in_progress_tasks: number;
    high_priority_open: number;
    project_names: string[];
    sample_tasks: Array<{
      id: string;
      title: string;
      due_date?: string | null;
      status: string;
    }>;
  }>;
  task_status_breakdown: {
    todo: SprintTaskSummary[];
    in_progress: SprintTaskSummary[];
    done: SprintTaskSummary[];
  };
}

export interface SprintInsightsResponse {
  sprint: Sprint;
  sprint_family: Sprint[];
  insights: SprintInsights;
}
