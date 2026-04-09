import type { TaskStatusValue } from "../../utils/taskStatus";

export interface DashboardSummary {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusValue;
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export type TaskSortOption =
  | "due_asc"
  | "due_desc"
  | "priority_desc"
  | "priority_asc"
  | "title_asc"
  | "recent";

export type TaskGroupOption = "none" | "status" | "priority" | "due";

export interface TasksPagination {
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}
