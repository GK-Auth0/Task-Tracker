import type { TaskStatusValue } from "../utils/taskStatus";

export interface TaskSubtask {
  id: string;
  title: string;
  is_completed: boolean;
  position?: number;
  assignee_id?: string;
  linked_task_id?: string;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusValue;
  priority: "low" | "medium" | "high";
  issueType?: "Story" | "Task" | "Bug";
  startDate?: string;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
  defectId?: string;
  sprintId?: string;
  subtasks?: TaskSubtask[];
  sprint?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatusValue;
  priority?: "low" | "medium" | "high";
  issueType?: "Story" | "Task" | "Bug";
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
  defectId?: string;
  sprintId?: string;
}

export interface TasksResponse {
  success: boolean;
  data: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
