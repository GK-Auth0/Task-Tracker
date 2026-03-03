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
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface TasksPagination {
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}
